import type { Context, MiddlewareHandler } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { sign, verify } from 'hono/jwt'

export interface JWTConfig {
  secret: string
  algorithm?:
    | 'HS256'
    | 'HS384'
    | 'HS512'
    | 'RS256'
    | 'RS384'
    | 'RS512'
    | 'ES256'
    | 'ES384'
    | 'ES512'
  expiresIn?: string | number // e.g., '1h', '7d', 3600
  refreshExpiresIn?: string | number
  issuer?: string
  audience?: string
  cookieName?: string
  refreshCookieName?: string
  cookieOptions?: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    domain?: string
    path?: string
  }
}

export interface JWTUser {
  id: string
  email: string
  username?: string
  roles?: string[]
  permissions?: string[]
  [key: string]: unknown
}

export interface JWTPayload {
  iat?: number
  exp?: number
  iss?: string
  aud?: string
  sub?: string
  [key: string]: unknown
}

export interface JWTTokenPayload extends JWTPayload {
  sub: string // user id
  email: string
  username?: string
  roles?: string[]
  permissions?: string[]
  type: 'access' | 'refresh'
  iat: number
  exp: number
  iss?: string
  aud?: string
  [key: string]: unknown
}

export class JWTAuthService {
  private config: Required<JWTConfig>

  constructor(config: JWTConfig) {
    this.config = {
      algorithm: 'HS256',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
      issuer: 'jwt-auth-service',
      audience: 'jwt-auth-service',
      cookieName: 'auth_token',
      refreshCookieName: 'refresh_token',
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      },
      ...config,
    }
  }

  /**
   * Get configuration
   */
  getConfig(): Required<JWTConfig> {
    return this.config
  }

  /**
   * Generate access token
   */
  async generateAccessToken(user: JWTUser): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const exp = this.calculateExpiration(this.config.expiresIn, now)

    const payload: JWTTokenPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      type: 'access',
      iat: now,
      exp,
      ...(this.config.issuer && { iss: this.config.issuer }),
      ...(this.config.audience && { aud: this.config.audience }),
    }

    return await sign(payload, this.config.secret, this.config.algorithm)
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(user: JWTUser): Promise<string> {
    const now = Math.floor(Date.now() / 1000)
    const exp = this.calculateExpiration(this.config.refreshExpiresIn, now)

    const payload: JWTTokenPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
      iat: now,
      exp,
      ...(this.config.issuer && { iss: this.config.issuer }),
      ...(this.config.audience && { aud: this.config.audience }),
    }

    return await sign(payload, this.config.secret, this.config.algorithm)
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokens(user: JWTUser): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ])

    return { accessToken, refreshToken }
  }

  /**
   * Verify and decode token
   */
  async verifyToken(token: string): Promise<JWTTokenPayload> {
    try {
      const payload = (await verify(
        token,
        this.config.secret,
        this.config.algorithm
      ) as unknown) as JWTTokenPayload

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        throw new Error('Token expired')
      }

      // Validate issuer and audience if configured
      if (this.config.issuer && payload.iss !== this.config.issuer) {
        throw new Error('Invalid issuer')
      }

      if (this.config.audience && payload.aud !== this.config.audience) {
        throw new Error('Invalid audience')
      }

      return payload
    } catch (error) {
      throw new Error(`Invalid token: ${(error as Error).message}`)
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    getUserById: (id: string) => Promise<JWTUser | null>
  ): Promise<string> {
    const payload = await this.verifyToken(refreshToken)

    if (payload.type !== 'refresh') {
      throw new Error('Invalid refresh token')
    }

    // Get fresh user data
    const user = await getUserById(payload.sub)
    if (!user) {
      throw new Error('User not found')
    }

    return await this.generateAccessToken(user)
  }

  /**
   * Set authentication cookies
   */
  setAuthCookies(c: Context, accessToken: string, refreshToken: string): void {
    const accessExp = this.calculateExpiration(this.config.expiresIn)
    const refreshExp = this.calculateExpiration(this.config.refreshExpiresIn)

    setCookie(c, this.config.cookieName, accessToken, {
      ...this.config.cookieOptions,
      maxAge: typeof this.config.expiresIn === 'number' ? this.config.expiresIn : undefined,
      expires: new Date(accessExp * 1000),
    })

    setCookie(c, this.config.refreshCookieName, refreshToken, {
      ...this.config.cookieOptions,
      maxAge:
        typeof this.config.refreshExpiresIn === 'number' ? this.config.refreshExpiresIn : undefined,
      expires: new Date(refreshExp * 1000),
    })
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies(c: Context): void {
    deleteCookie(c, this.config.cookieName, {
      path: this.config.cookieOptions.path,
      domain: this.config.cookieOptions.domain,
    })
    deleteCookie(c, this.config.refreshCookieName, {
      path: this.config.cookieOptions.path,
      domain: this.config.cookieOptions.domain,
    })
  }

  /**
   * Get token from request (header or cookie)
   */
  getTokenFromRequest(c: Context): string | null {
    // Try Authorization header first
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7)
    }

    // Try cookie
    return getCookie(c, this.config.cookieName) || null
  }

  /**
   * Get refresh token from request
   */
  getRefreshTokenFromRequest(c: Context): string | null {
    return getCookie(c, this.config.refreshCookieName) || null
  }

  /**
   * Calculate expiration timestamp
   */
  private calculateExpiration(expiresIn: string | number, baseTime?: number): number {
    const base = baseTime || Math.floor(Date.now() / 1000)

    if (typeof expiresIn === 'number') {
      return base + expiresIn
    }

    // Parse string format like '1h', '7d', '30m'
    const match = expiresIn.match(/^(\d+)([smhd])$/)
    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`)
    }

    const [, amount, unit] = match
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 }

    return base + parseInt(amount, 10) * multipliers[unit as keyof typeof multipliers]
  }
}

/**
 * JWT Authentication Middleware
 */
export function createJWTAuthMiddleware(
  authService: JWTAuthService,
  options: {
    required?: boolean
    roles?: string[]
    permissions?: string[]
    getUserById?: (id: string) => Promise<JWTUser | null>
  } = {}
): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const token = authService.getTokenFromRequest(c)

    if (!token) {
      if (options.required !== false) {
        throw new HTTPException(401, { message: 'Authentication required' })
      }
      return await next()
    }

    try {
      const payload = await authService.verifyToken(token)

      if (payload.type !== 'access') {
        throw new Error('Invalid token type')
      }

      // Check roles if specified
      if (options.roles && options.roles.length > 0) {
        const userRoles = payload.roles || []
        const hasRole = options.roles.some(role => userRoles.includes(role))
        if (!hasRole) {
          throw new HTTPException(403, { message: 'Insufficient permissions' })
        }
      }

      // Check permissions if specified
      if (options.permissions && options.permissions.length > 0) {
        const userPermissions = payload.permissions || []
        const hasPermission = options.permissions.some(permission =>
          userPermissions.includes(permission)
        )
        if (!hasPermission) {
          throw new HTTPException(403, { message: 'Insufficient permissions' })
        }
      }

      // Set user context
      c.set('user', {
        id: payload.sub,
        email: payload.email,
        username: payload.username,
        roles: payload.roles,
        permissions: payload.permissions,
      })

      c.set('jwtPayload', payload)
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
 * JWT Refresh Middleware
 */
export function createJWTRefreshMiddleware(
  authService: JWTAuthService,
  getUserById: (id: string) => Promise<JWTUser | null>
): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const refreshToken = authService.getRefreshTokenFromRequest(c)

    if (!refreshToken) {
      throw new HTTPException(401, { message: 'Refresh token required' })
    }

    try {
      const newAccessToken = await authService.refreshAccessToken(refreshToken, getUserById)

      // Set new token in response
      const expiresInValue = authService.getConfig().expiresIn
      const expiresInSeconds = typeof expiresInValue === 'number' ? expiresInValue : 3600
      const accessExp = Math.floor(Date.now() / 1000) + expiresInSeconds

      setCookie(c, authService.getConfig().cookieName, newAccessToken, {
        ...authService.getConfig().cookieOptions,
        expires: new Date(accessExp * 1000),
      })

      c.set('newAccessToken', newAccessToken)
    } catch (error) {
      throw new HTTPException(401, { message: `Token refresh failed: ${(error as Error).message}` })
    }

    return await next()
  })
}

/**
 * Create JWT auth routes
 */
export function createJWTAuthRoutes(
  authService: JWTAuthService,
  options: {
    loginHandler: (email: string, password: string) => Promise<JWTUser | null>
    getUserById: (id: string) => Promise<JWTUser | null>
    registerHandler?: (userData: Record<string, unknown>) => Promise<JWTUser>
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

      const { accessToken, refreshToken } = await authService.generateTokens(user)
      authService.setAuthCookies(c, accessToken, refreshToken)

      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      })
    },

    // Register endpoint
    register: async (c: Context) => {
      if (!options.registerHandler) {
        throw new HTTPException(404, { message: 'Registration not available' })
      }

      const userData = await c.req.json()
      const user = await options.registerHandler(userData)

      const { accessToken, refreshToken } = await authService.generateTokens(user)
      authService.setAuthCookies(c, accessToken, refreshToken)

      return c.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
        tokens: {
          accessToken,
          refreshToken,
        },
      })
    },

    // Refresh endpoint
    refresh: createJWTRefreshMiddleware(authService, options.getUserById),

    // Logout endpoint
    logout: async (c: Context) => {
      authService.clearAuthCookies(c)
      return c.json({ success: true, message: 'Logged out successfully' })
    },

    // Profile endpoint
    profile: async (c: Context) => {
      const user = c.get('user')
      if (!user) {
        throw new HTTPException(401, { message: 'Authentication required' })
      }

      return c.json({ user })
    },
  }
}

export default JWTAuthService
