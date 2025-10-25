import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'

export interface ApiKeyConfig {
  prefix?: string
  keyLength?: number
  hashAlgorithm?: string
  headerName?: string
  queryParam?: string
  store?: ApiKeyStore
  rateLimiting?: {
    enabled: boolean
    windowMs: number
    maxRequests: number
  }
  logging?: {
    enabled: boolean
    logSuccessful?: boolean
    logFailed?: boolean
  }
}

export interface ApiKey {
  id: string
  name: string
  keyHash: string
  userId?: string
  scopes: string[]
  permissions: string[]
  rateLimit?: {
    requests: number
    windowMs: number
  }
  metadata: Record<string, any>
  createdAt: number
  lastUsedAt?: number
  expiresAt?: number
  isActive: boolean
  usageCount: number
}

export interface ApiKeyUsage {
  keyId: string
  timestamp: number
  endpoint: string
  method: string
  ip: string
  userAgent?: string
  success: boolean
  error?: string
}

export interface ApiKeyStore {
  getByHash(keyHash: string): Promise<ApiKey | null>
  getById(id: string): Promise<ApiKey | null>
  getByUserId(userId: string): Promise<ApiKey[]>
  create(apiKey: ApiKey): Promise<void>
  update(id: string, updates: Partial<ApiKey>): Promise<void>
  delete(id: string): Promise<void>
  recordUsage(usage: ApiKeyUsage): Promise<void>
  getUsage(keyId: string, from?: number, to?: number): Promise<ApiKeyUsage[]>
  cleanup(): Promise<void>
}

/**
 * In-memory API key store (for development)
 */
export class MemoryApiKeyStore implements ApiKeyStore {
  private keys = new Map<string, ApiKey>()
  private usage = new Map<string, ApiKeyUsage[]>()
  private hashIndex = new Map<string, string>() // hash -> id mapping

  async getByHash(keyHash: string): Promise<ApiKey | null> {
    const id = this.hashIndex.get(keyHash)
    return id ? this.keys.get(id) || null : null
  }

  async getById(id: string): Promise<ApiKey | null> {
    return this.keys.get(id) || null
  }

  async getByUserId(userId: string): Promise<ApiKey[]> {
    return Array.from(this.keys.values()).filter(key => key.userId === userId)
  }

  async create(apiKey: ApiKey): Promise<void> {
    this.keys.set(apiKey.id, apiKey)
    this.hashIndex.set(apiKey.keyHash, apiKey.id)
  }

  async update(id: string, updates: Partial<ApiKey>): Promise<void> {
    const existing = this.keys.get(id)
    if (existing) {
      const updated = { ...existing, ...updates }
      this.keys.set(id, updated)
      
      // Update hash index if keyHash changed
      if (updates.keyHash && updates.keyHash !== existing.keyHash) {
        this.hashIndex.delete(existing.keyHash)
        this.hashIndex.set(updates.keyHash, id)
      }
    }
  }

  async delete(id: string): Promise<void> {
    const existing = this.keys.get(id)
    if (existing) {
      this.keys.delete(id)
      this.hashIndex.delete(existing.keyHash)
      this.usage.delete(id)
    }
  }

  async recordUsage(usage: ApiKeyUsage): Promise<void> {
    const keyUsage = this.usage.get(usage.keyId) || []
    keyUsage.push(usage)
    this.usage.set(usage.keyId, keyUsage)
  }

  async getUsage(keyId: string, from?: number, to?: number): Promise<ApiKeyUsage[]> {
    const keyUsage = this.usage.get(keyId) || []
    
    if (!from && !to) return keyUsage
    
    return keyUsage.filter(usage => {
      if (from && usage.timestamp < from) return false
      if (to && usage.timestamp > to) return false
      return true
    })
  }

  async cleanup(): Promise<void> {
    const now = Date.now()
    
    // Remove expired keys
    for (const [id, key] of this.keys.entries()) {
      if (key.expiresAt && now > key.expiresAt) {
        await this.delete(id)
      }
    }
  }
}

/**
 * Database API key store
 */
export class DatabaseApiKeyStore implements ApiKeyStore {
  private db: any
  private keysTable: string
  private usageTable: string

  constructor(db: any, keysTable = 'api_keys', usageTable = 'api_key_usage') {
    this.db = db
    this.keysTable = keysTable
    this.usageTable = usageTable
  }

  async getByHash(keyHash: string): Promise<ApiKey | null> {
    try {
      const result = await this.db
        .select()
        .from(this.keysTable)
        .where('key_hash', keyHash)
        .where('is_active', true)
        .first()

      return result ? this.mapDbToApiKey(result) : null
    } catch (error) {
      console.error('Database API key get by hash error:', error)
      return null
    }
  }

  async getById(id: string): Promise<ApiKey | null> {
    try {
      const result = await this.db
        .select()
        .from(this.keysTable)
        .where('id', id)
        .first()

      return result ? this.mapDbToApiKey(result) : null
    } catch (error) {
      console.error('Database API key get by ID error:', error)
      return null
    }
  }

  async getByUserId(userId: string): Promise<ApiKey[]> {
    try {
      const results = await this.db
        .select()
        .from(this.keysTable)
        .where('user_id', userId)
        .where('is_active', true)

      return results.map((result: any) => this.mapDbToApiKey(result))
    } catch (error) {
      console.error('Database API key get by user ID error:', error)
      return []
    }
  }

  async create(apiKey: ApiKey): Promise<void> {
    try {
      await this.db.insert(this.mapApiKeyToDb(apiKey)).into(this.keysTable)
    } catch (error) {
      console.error('Database API key create error:', error)
      throw error
    }
  }

  async update(id: string, updates: Partial<ApiKey>): Promise<void> {
    try {
      const dbUpdates = this.mapApiKeyToDb(updates as ApiKey, true)
      await this.db
        .update(dbUpdates)
        .from(this.keysTable)
        .where('id', id)
    } catch (error) {
      console.error('Database API key update error:', error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete().from(this.keysTable).where('id', id)
      await this.db.delete().from(this.usageTable).where('key_id', id)
    } catch (error) {
      console.error('Database API key delete error:', error)
      throw error
    }
  }

  async recordUsage(usage: ApiKeyUsage): Promise<void> {
    try {
      await this.db.insert({
        key_id: usage.keyId,
        timestamp: usage.timestamp,
        endpoint: usage.endpoint,
        method: usage.method,
        ip: usage.ip,
        user_agent: usage.userAgent,
        success: usage.success,
        error: usage.error
      }).into(this.usageTable)
    } catch (error) {
      console.error('Database API key usage record error:', error)
    }
  }

  async getUsage(keyId: string, from?: number, to?: number): Promise<ApiKeyUsage[]> {
    try {
      let query = this.db
        .select()
        .from(this.usageTable)
        .where('key_id', keyId)

      if (from) query = query.where('timestamp', '>=', from)
      if (to) query = query.where('timestamp', '<=', to)

      const results = await query.orderBy('timestamp', 'desc')
      
      return results.map((result: any) => ({
        keyId: result.key_id,
        timestamp: result.timestamp,
        endpoint: result.endpoint,
        method: result.method,
        ip: result.ip,
        userAgent: result.user_agent,
        success: result.success,
        error: result.error
      }))
    } catch (error) {
      console.error('Database API key usage get error:', error)
      return []
    }
  }

  async cleanup(): Promise<void> {
    try {
      const now = Date.now()
      await this.db
        .delete()
        .from(this.keysTable)
        .where('expires_at', '<', now)
    } catch (error) {
      console.error('Database API key cleanup error:', error)
    }
  }

  private mapDbToApiKey(dbRow: any): ApiKey {
    return {
      id: dbRow.id,
      name: dbRow.name,
      keyHash: dbRow.key_hash,
      userId: dbRow.user_id,
      scopes: dbRow.scopes ? JSON.parse(dbRow.scopes) : [],
      permissions: dbRow.permissions ? JSON.parse(dbRow.permissions) : [],
      rateLimit: dbRow.rate_limit ? JSON.parse(dbRow.rate_limit) : undefined,
      metadata: dbRow.metadata ? JSON.parse(dbRow.metadata) : {},
      createdAt: dbRow.created_at,
      lastUsedAt: dbRow.last_used_at,
      expiresAt: dbRow.expires_at,
      isActive: dbRow.is_active,
      usageCount: dbRow.usage_count || 0
    }
  }

  private mapApiKeyToDb(apiKey: ApiKey, isUpdate = false): any {
    const dbRow: any = {
      name: apiKey.name,
      key_hash: apiKey.keyHash,
      user_id: apiKey.userId,
      scopes: JSON.stringify(apiKey.scopes),
      permissions: JSON.stringify(apiKey.permissions),
      rate_limit: apiKey.rateLimit ? JSON.stringify(apiKey.rateLimit) : null,
      metadata: JSON.stringify(apiKey.metadata),
      last_used_at: apiKey.lastUsedAt,
      expires_at: apiKey.expiresAt,
      is_active: apiKey.isActive,
      usage_count: apiKey.usageCount
    }

    if (!isUpdate) {
      dbRow.id = apiKey.id
      dbRow.created_at = apiKey.createdAt
    }

    return dbRow
  }
}

export class ApiKeyManager {
  private config: Required<ApiKeyConfig>
  private store: ApiKeyStore
  private rateLimitCache = new Map<string, { count: number, resetTime: number }>()

  constructor(config: ApiKeyConfig) {
    this.config = {
      prefix: 'ak',
      keyLength: 32,
      hashAlgorithm: 'sha256',
      headerName: 'X-API-Key',
      queryParam: 'api_key',
      store: new MemoryApiKeyStore(),
      rateLimiting: {
        enabled: false,
        windowMs: 60000, // 1 minute
        maxRequests: 100
      },
      logging: {
        enabled: true,
        logSuccessful: false,
        logFailed: true
      },
      ...config
    }
    this.store = this.config.store

    // Cleanup expired keys every hour
    setInterval(() => this.store.cleanup(), 60 * 60 * 1000)
  }

  /**
   * Generate a new API key
   */
  generateApiKey(): { key: string, hash: string } {
    const keyBytes = randomBytes(this.config.keyLength)
    const key = `${this.config.prefix}_${keyBytes.toString('base64url')}`
    const hash = createHash(this.config.hashAlgorithm).update(key).digest('hex')
    
    return { key, hash }
  }

  /**
   * Create a new API key
   */
  async createApiKey(options: {
    name: string
    userId?: string
    scopes?: string[]
    permissions?: string[]
    rateLimit?: { requests: number, windowMs: number }
    expiresAt?: number
    metadata?: Record<string, any>
  }): Promise<{ apiKey: ApiKey, key: string }> {
    const { key, hash } = this.generateApiKey()
    const id = randomBytes(16).toString('hex')
    
    const apiKey: ApiKey = {
      id,
      name: options.name,
      keyHash: hash,
      userId: options.userId,
      scopes: options.scopes || [],
      permissions: options.permissions || [],
      rateLimit: options.rateLimit,
      metadata: options.metadata || {},
      createdAt: Date.now(),
      expiresAt: options.expiresAt,
      isActive: true,
      usageCount: 0
    }

    await this.store.create(apiKey)
    
    return { apiKey, key }
  }

  /**
   * Validate API key
   */
  async validateApiKey(key: string): Promise<ApiKey | null> {
    if (!key || !key.startsWith(`${this.config.prefix}_`)) {
      return null
    }

    const hash = createHash(this.config.hashAlgorithm).update(key).digest('hex')
    const apiKey = await this.store.getByHash(hash)
    
    if (!apiKey || !apiKey.isActive) {
      return null
    }

    // Check expiration
    if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
      await this.store.update(apiKey.id, { isActive: false })
      return null
    }

    return apiKey
  }

  /**
   * Check rate limit for API key
   */
  checkRateLimit(apiKey: ApiKey): { allowed: boolean, resetTime?: number } {
    if (!this.config.rateLimiting.enabled && !apiKey.rateLimit) {
      return { allowed: true }
    }

    const limit = apiKey.rateLimit || this.config.rateLimiting
    const now = Date.now()
    const windowStart = Math.floor(now / limit.windowMs) * limit.windowMs
    const resetTime = windowStart + limit.windowMs
    
    const cacheKey = `${apiKey.id}:${windowStart}`
    const current = this.rateLimitCache.get(cacheKey) || { count: 0, resetTime }
    
    if (current.count >= limit.maxRequests) {
      return { allowed: false, resetTime }
    }

    // Increment counter
    current.count++
    this.rateLimitCache.set(cacheKey, current)
    
    // Clean up old entries
    this.cleanupRateLimitCache(now)
    
    return { allowed: true, resetTime }
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupRateLimitCache(now: number): void {
    for (const [key, data] of this.rateLimitCache.entries()) {
      if (now > data.resetTime) {
        this.rateLimitCache.delete(key)
      }
    }
  }

  /**
   * Record API key usage
   */
  async recordUsage(
    apiKey: ApiKey,
    context: {
      endpoint: string
      method: string
      ip: string
      userAgent?: string
      success: boolean
      error?: string
    }
  ): Promise<void> {
    // Update last used time and usage count
    await this.store.update(apiKey.id, {
      lastUsedAt: Date.now(),
      usageCount: apiKey.usageCount + 1
    })

    // Record detailed usage if logging enabled
    if (this.config.logging.enabled) {
      const shouldLog = context.success ? 
        this.config.logging.logSuccessful : 
        this.config.logging.logFailed

      if (shouldLog) {
        await this.store.recordUsage({
          keyId: apiKey.id,
          timestamp: Date.now(),
          endpoint: context.endpoint,
          method: context.method,
          ip: context.ip,
          userAgent: context.userAgent,
          success: context.success,
          error: context.error
        })
      }
    }
  }

  /**
   * Get API key from request
   */
  getApiKeyFromRequest(c: Context): string | null {
    // Check header first
    const headerKey = c.req.header(this.config.headerName)
    if (headerKey) return headerKey

    // Check query parameter
    const queryKey = c.req.query(this.config.queryParam)
    if (queryKey) return queryKey

    return null
  }

  /**
   * Revoke API key
   */
  async revokeApiKey(id: string): Promise<void> {
    await this.store.update(id, { isActive: false })
  }

  /**
   * Get API keys for user
   */
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return await this.store.getByUserId(userId)
  }

  /**
   * Get API key usage statistics
   */
  async getUsageStats(keyId: string, from?: number, to?: number): Promise<ApiKeyUsage[]> {
    return await this.store.getUsage(keyId, from, to)
  }
}

/**
 * API key authentication middleware
 */
export function createApiKeyAuthMiddleware(
  apiKeyManager: ApiKeyManager,
  options: {
    required?: boolean
    scopes?: string[]
    permissions?: string[]
  } = {}
): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    const apiKey = apiKeyManager.getApiKeyFromRequest(c)
    
    if (!apiKey) {
      if (options.required !== false) {
        throw new HTTPException(401, { message: 'API key required' })
      }
      return await next()
    }

    try {
      const validatedKey = await apiKeyManager.validateApiKey(apiKey)
      
      if (!validatedKey) {
        throw new HTTPException(401, { message: 'Invalid API key' })
      }

      // Check scopes
      if (options.scopes && options.scopes.length > 0) {
        const hasScope = options.scopes.some(scope => validatedKey.scopes.includes(scope))
        if (!hasScope) {
          throw new HTTPException(403, { message: 'Insufficient scope' })
        }
      }

      // Check permissions
      if (options.permissions && options.permissions.length > 0) {
        const hasPermission = options.permissions.some(permission => 
          validatedKey.permissions.includes(permission)
        )
        if (!hasPermission) {
          throw new HTTPException(403, { message: 'Insufficient permissions' })
        }
      }

      // Check rate limit
      const rateLimitResult = apiKeyManager.checkRateLimit(validatedKey)
      if (!rateLimitResult.allowed) {
        c.header('X-RateLimit-Reset', rateLimitResult.resetTime?.toString() || '')
        throw new HTTPException(429, { message: 'Rate limit exceeded' })
      }

      // Set context
      c.set('apiKey', validatedKey)
      c.set('user', {
        id: validatedKey.userId,
        type: 'api_key',
        scopes: validatedKey.scopes,
        permissions: validatedKey.permissions
      })

      // Record usage after request
      const originalNext = next
      const wrappedNext = async () => {
        let success = true
        let error: string | undefined

        try {
          await originalNext()
        } catch (err) {
          success = false
          error = (err as Error).message
          throw err
        } finally {
          await apiKeyManager.recordUsage(validatedKey, {
            endpoint: c.req.path,
            method: c.req.method,
            ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
            userAgent: c.req.header('user-agent'),
            success,
            error
          })
        }
      }

      return await wrappedNext()

    } catch (error) {
      if (options.required !== false) {
        throw new HTTPException(401, { message: `API key authentication failed: ${(error as Error).message}` })
      }
    }

    return await next()
  })
}

/**
 * Create API key management routes
 */
export function createApiKeyRoutes(apiKeyManager: ApiKeyManager) {
  return {
    // Create new API key
    create: async (c: Context) => {
      const { name, scopes, permissions, rateLimit, expiresAt, metadata } = await c.req.json()
      const userId = c.get('user')?.id
      
      if (!name) {
        throw new HTTPException(400, { message: 'API key name required' })
      }

      const result = await apiKeyManager.createApiKey({
        name,
        userId,
        scopes,
        permissions,
        rateLimit,
        expiresAt,
        metadata
      })

      return c.json({
        success: true,
        apiKey: {
          ...result.apiKey,
          keyHash: undefined // Don't expose hash
        },
        key: result.key // Only returned once
      })
    },

    // List user's API keys
    list: async (c: Context) => {
      const userId = c.get('user')?.id
      if (!userId) {
        throw new HTTPException(401, { message: 'User authentication required' })
      }

      const apiKeys = await apiKeyManager.getUserApiKeys(userId)
      
      return c.json({
        success: true,
        apiKeys: apiKeys.map(key => ({
          ...key,
          keyHash: undefined // Don't expose hash
        }))
      })
    },

    // Revoke API key
    revoke: async (c: Context) => {
      const keyId = c.req.param('id')
      const userId = c.get('user')?.id
      
      if (!keyId) {
        throw new HTTPException(400, { message: 'API key ID required' })
      }

      const apiKey = await apiKeyManager.store.getById(keyId)
      if (!apiKey || apiKey.userId !== userId) {
        throw new HTTPException(404, { message: 'API key not found' })
      }

      await apiKeyManager.revokeApiKey(keyId)
      
      return c.json({ success: true, message: 'API key revoked' })
    },

    // Get API key usage stats
    usage: async (c: Context) => {
      const keyId = c.req.param('id')
      const userId = c.get('user')?.id
      const from = c.req.query('from') ? parseInt(c.req.query('from')!) : undefined
      const to = c.req.query('to') ? parseInt(c.req.query('to')!) : undefined
      
      if (!keyId) {
        throw new HTTPException(400, { message: 'API key ID required' })
      }

      const apiKey = await apiKeyManager.store.getById(keyId)
      if (!apiKey || apiKey.userId !== userId) {
        throw new HTTPException(404, { message: 'API key not found' })
      }

      const usage = await apiKeyManager.getUsageStats(keyId, from, to)
      
      return c.json({ success: true, usage })
    }
  }
}

export default ApiKeyManager