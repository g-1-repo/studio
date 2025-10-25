import { randomBytes } from 'node:crypto'
import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

export interface SessionConfig {
  sessionName?: string
  secret: string
  maxAge?: number // in seconds
  rolling?: boolean // extend session on activity
  cookieOptions?: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    domain?: string
    path?: string
  }
  store?: SessionStore
  generateId?: () => string
}

export interface SessionData {
  id: string
  userId?: string
  email?: string
  username?: string
  roles?: string[]
  permissions?: string[]
  createdAt: number
  lastAccessed: number
  expiresAt: number
  data: Record<string, unknown>
}

export interface SessionStore {
  get(sessionId: string): Promise<SessionData | null>
  set(sessionId: string, session: SessionData): Promise<void>
  delete(sessionId: string): Promise<void>
  cleanup(): Promise<void>
}

/**
 * In-memory session store (for development)
 */
export class MemorySessionStore implements SessionStore {
  private sessions = new Map<string, SessionData>()
  private cleanupInterval?: NodeJS.Timeout

  constructor(cleanupIntervalMs = 60000) {
    // Cleanup expired sessions every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, cleanupIntervalMs)
  }

  async get(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Check if expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId)
      return null
    }

    return session
  }

  async set(sessionId: string, session: SessionData): Promise<void> {
    this.sessions.set(sessionId, session)
  }

  async delete(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
  }

  async cleanup(): Promise<void> {
    const now = Date.now()
    for (const [id, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(id)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.sessions.clear()
  }
}

/**
 * Redis session store (for production)
 */
export class RedisSessionStore implements SessionStore {
  private redis: unknown // Redis client
  private keyPrefix: string

  constructor(redis: unknown, keyPrefix = 'session:') {
    this.redis = redis
    this.keyPrefix = keyPrefix
  }

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const data = await (this.redis as any).get(`${this.keyPrefix}${sessionId}`)
      return data ? JSON.parse(data as string) : null
    } catch (error) {
      console.error('Redis session get error:', error)
      return null
    }
  }

  async set(sessionId: string, session: SessionData): Promise<void> {
    try {
      const ttl = Math.ceil((session.expiresAt - Date.now()) / 1000)
      await (this.redis as any).setex(
        `${this.keyPrefix}${sessionId}`,
        Math.max(ttl, 1),
        JSON.stringify(session)
      )
    } catch (error) {
      console.error('Redis session set error:', error)
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      await (this.redis as any).del(`${this.keyPrefix}${sessionId}`)
    } catch (error) {
      console.error('Redis session delete error:', error)
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles TTL automatically, no manual cleanup needed
  }
}

/**
 * Database session store
 */
export class DatabaseSessionStore implements SessionStore {
  private db: unknown // Database connection
  private tableName: string

  constructor(db: unknown, tableName = 'sessions') {
    this.db = db
    this.tableName = tableName
  }

  async get(sessionId: string): Promise<SessionData | null> {
    try {
      const result = await (this.db as any).select().from(this.tableName).where('id', sessionId).first()

      if (!result) return null

      // Check if expired
      if (Date.now() > result.expires_at) {
        await this.delete(sessionId)
        return null
      }

      return {
        id: result.id,
        userId: result.user_id,
        email: result.email,
        username: result.username,
        roles: result.roles ? JSON.parse(result.roles as string) : [],
        permissions: result.permissions ? JSON.parse(result.permissions as string) : [],
        createdAt: result.created_at,
        lastAccessed: result.last_accessed,
        expiresAt: result.expires_at,
        data: result.data ? JSON.parse(result.data as string) : {},
      }
    } catch (error) {
      console.error('Database session get error:', error)
      return null
    }
  }

  async set(_sessionId: string, session: SessionData): Promise<void> {
    try {
      await (this.db as any)
        .insert({
          id: session.id,
          user_id: session.userId,
          email: session.email,
          username: session.username,
          roles: session.roles ? JSON.stringify(session.roles) : null,
          permissions: session.permissions ? JSON.stringify(session.permissions) : null,
          created_at: session.createdAt,
          last_accessed: session.lastAccessed,
          expires_at: session.expiresAt,
          data: JSON.stringify(session.data),
        })
        .into(this.tableName)
        .onConflict('id')
        .merge()
    } catch (error) {
      console.error('Database session set error:', error)
    }
  }

  async delete(sessionId: string): Promise<void> {
    try {
      await (this.db as any).delete().from(this.tableName).where('id', sessionId)
    } catch (error) {
      console.error('Database session delete error:', error)
    }
  }

  async cleanup(): Promise<void> {
    try {
      await (this.db as any).delete().from(this.tableName).where('expires_at', '<', Date.now())
    } catch (error) {
      console.error('Database session cleanup error:', error)
    }
  }
}

export class SessionManager {
  private config: Required<SessionConfig>
  private store: SessionStore

  constructor(config: SessionConfig) {
    this.config = {
      sessionName: 'sessionId',
      maxAge: 24 * 60 * 60, // 24 hours
      rolling: true,
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      },
      store: new MemorySessionStore(),
      generateId: () => randomBytes(32).toString('hex'),
      ...config,
    }
    this.store = this.config.store
  }

  /**
   * Generate a secure session ID
   */
  generateSessionId(): string {
    return this.config.generateId()
  }

  /**
   * Create a new session
   */
  async createSession(userId?: string, userData: Partial<SessionData> = {}): Promise<SessionData> {
    const sessionId = this.generateSessionId()
    const now = Date.now()
    const expiresAt = now + this.config.maxAge * 1000

    const session: SessionData = {
      id: sessionId,
      userId,
      email: userData.email,
      username: userData.username,
      roles: userData.roles || [],
      permissions: userData.permissions || [],
      createdAt: now,
      lastAccessed: now,
      expiresAt,
      data: userData.data || {},
    }

    await this.store.set(sessionId, session)
    return session
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.store.get(sessionId)
    if (!session) return null

    // Update last accessed time if rolling sessions
    if (this.config.rolling) {
      session.lastAccessed = Date.now()
      session.expiresAt = Date.now() + this.config.maxAge * 1000
      await this.store.set(sessionId, session)
    }

    return session
  }

  /**
   * Update session data
   */
  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<SessionData | null> {
    const session = await this.store.get(sessionId)
    if (!session) return null

    const updatedSession = {
      ...session,
      ...updates,
      lastAccessed: Date.now(),
    }

    await this.store.set(sessionId, updatedSession)
    return updatedSession
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId: string): Promise<void> {
    await this.store.delete(sessionId)
  }

  /**
   * Set session cookie
   */
  setSessionCookie(c: Context, sessionId: string): void {
    setCookie(c, this.config.sessionName, sessionId, {
      ...this.config.cookieOptions,
      maxAge: this.config.maxAge,
      expires: new Date(Date.now() + this.config.maxAge * 1000),
    })
  }

  /**
   * Clear session cookie
   */
  clearSessionCookie(c: Context): void {
    deleteCookie(c, this.config.sessionName, {
      path: this.config.cookieOptions.path,
      domain: this.config.cookieOptions.domain,
    })
  }

  /**
   * Get session ID from request
   */
  getSessionIdFromRequest(c: Context): string | null {
    return getCookie(c, this.config.sessionName) || null
  }
}

/**
 * Session authentication middleware
 */
export function createSessionAuthMiddleware(
  sessionManager: SessionManager,
  options: {
    required?: boolean
    roles?: string[]
    permissions?: string[]
  } = {}
): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const sessionId = sessionManager.getSessionIdFromRequest(c)

    if (!sessionId) {
      if (options.required !== false) {
        throw new HTTPException(401, { message: 'Authentication required' })
      }
      return await next()
    }

    try {
      const session = await sessionManager.getSession(sessionId)

      if (!session) {
        sessionManager.clearSessionCookie(c)
        if (options.required !== false) {
          throw new HTTPException(401, { message: 'Invalid session' })
        }
        return await next()
      }

      // Check roles if specified
      if (options.roles && options.roles.length > 0) {
        const userRoles = session.roles || []
        const hasRole = options.roles.some(role => userRoles.includes(role))
        if (!hasRole) {
          throw new HTTPException(403, { message: 'Insufficient permissions' })
        }
      }

      // Check permissions if specified
      if (options.permissions && options.permissions.length > 0) {
        const userPermissions = session.permissions || []
        const hasPermission = options.permissions.some(permission =>
          userPermissions.includes(permission)
        )
        if (!hasPermission) {
          throw new HTTPException(403, { message: 'Insufficient permissions' })
        }
      }

      // Set session and user context
      c.set('session', session)
      c.set('user', {
        id: session.userId,
        email: session.email,
        username: session.username,
        roles: session.roles,
        permissions: session.permissions,
      })
    } catch (error) {
      if (options.required !== false) {
        throw new HTTPException(401, {
          message: `Authentication failed: ${(error as Error).message}`,
        })
      }
    }

    return await next()
  })
}

/**
 * Create session auth routes
 */
export function createSessionAuthRoutes(
  sessionManager: SessionManager,
  options: {
    loginHandler: (email: string, password: string) => Promise<SessionData | null>
    registerHandler?: (userData: Record<string, unknown>) => Promise<SessionData>
  }
) {
  return {
    // Login endpoint
    login: async (c: Context) => {
      const { email, password } = await c.req.json()

      if (!email || !password) {
        throw new HTTPException(400, { message: 'Email and password required' })
      }

      const user = await options.loginHandler(email, password)
      if (!user) {
        throw new HTTPException(401, { message: 'Invalid credentials' })
      }

      const session = await sessionManager.createSession(user.id, {
        email: user.email,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
      })

      sessionManager.setSessionCookie(c, session.id)

      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
        sessionId: session.id,
      })
    },

    // Register endpoint
    register: async (c: Context) => {
      if (!options.registerHandler) {
        throw new HTTPException(404, { message: 'Registration not available' })
      }

      const userData = await c.req.json()
      const user = await options.registerHandler(userData)

      const session = await sessionManager.createSession(user.id, {
        email: user.email,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions,
      })

      sessionManager.setSessionCookie(c, session.id)

      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
        sessionId: session.id,
      })
    },

    // Logout endpoint
    logout: async (c: Context) => {
      const sessionId = sessionManager.getSessionIdFromRequest(c)
      if (sessionId) {
        await sessionManager.destroySession(sessionId)
      }
      sessionManager.clearSessionCookie(c)
      return c.json({ success: true, message: 'Logged out successfully' })
    },

    // Profile endpoint
    profile: async (c: Context) => {
      const user = c.get('user')
      const session = c.get('session')

      if (!user || !session) {
        throw new HTTPException(401, { message: 'Authentication required' })
      }

      return c.json({
        user,
        session: {
          id: session.id,
          createdAt: session.createdAt,
          lastAccessed: session.lastAccessed,
          expiresAt: session.expiresAt,
        },
      })
    },
  }
}

export default SessionManager
