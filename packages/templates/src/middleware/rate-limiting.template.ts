import type { Context, Next } from 'hono'

/**
 * Rate limiting middleware templates
 */

export interface RateLimitConfig {
  windowMs?: number // Time window in milliseconds
  max?: number // Maximum number of requests per window
  message?: string | ((c: Context) => string | Promise<string>)
  statusCode?: number
  headers?: boolean // Include rate limit headers in response
  keyGenerator?: (c: Context) => string | Promise<string>
  skip?: (c: Context) => boolean | Promise<boolean>
  onLimitReached?: (c: Context) => void | Promise<void>
  store?: RateLimitStore
  standardHeaders?: boolean // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders?: boolean // Return rate limit info in the `X-RateLimit-*` headers
}

export interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>
  set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void>
  increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }>
  reset(key: string): Promise<void>
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  resetTime: Date
}

/**
 * In-memory rate limit store
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  private timers = new Map<string, NodeJS.Timeout>()

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    return this.store.get(key) || null
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void> {
    this.store.set(key, value)
    this.setExpiration(key, ttl)
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const resetTime = now + ttl
    const existing = this.store.get(key)

    if (!existing || existing.resetTime <= now) {
      const value = { count: 1, resetTime }
      this.store.set(key, value)
      this.setExpiration(key, ttl)
      return value
    }

    existing.count++
    this.store.set(key, existing)
    return existing
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
    const timer = this.timers.get(key)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(key)
    }
  }

  private setExpiration(key: string, ttl: number): void {
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    const timer = setTimeout(() => {
      this.store.delete(key)
      this.timers.delete(key)
    }, ttl)

    this.timers.set(key, timer)
  }
}

/**
 * Redis rate limit store
 */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private redis: any) {}

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = await this.redis.get(key)
    return data ? JSON.parse(data) : null
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void> {
    await this.redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(value))
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const resetTime = now + ttl
    
    const multi = this.redis.multi()
    multi.get(key)
    multi.incr(key)
    multi.expire(key, Math.ceil(ttl / 1000))
    
    const results = await multi.exec()
    const existing = results[0][1] ? JSON.parse(results[0][1]) : null
    const count = results[1][1]

    if (!existing || existing.resetTime <= now) {
      const value = { count: 1, resetTime }
      await this.set(key, value, ttl)
      return value
    }

    return { count, resetTime: existing.resetTime }
  }

  async reset(key: string): Promise<void> {
    await this.redis.del(key)
  }
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: Required<Omit<RateLimitConfig, 'store' | 'onLimitReached'>> = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later.',
  statusCode: 429,
  headers: true,
  keyGenerator: (c: Context) => c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown',
  skip: () => false,
  standardHeaders: true,
  legacyHeaders: false
}

/**
 * Create rate limiting middleware
 */
export function createRateLimitMiddleware(config: RateLimitConfig = {}) {
  const options = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config }
  const store = options.store || new MemoryRateLimitStore()

  return async (c: Context, next: Next) => {
    // Check if request should be skipped
    if (await options.skip(c)) {
      return next()
    }

    // Generate key for this request
    const key = await options.keyGenerator(c)
    
    // Get or increment counter
    const result = await store.increment(key, options.windowMs)
    const { count, resetTime } = result

    // Calculate rate limit info
    const rateLimitInfo: RateLimitInfo = {
      limit: options.max,
      remaining: Math.max(0, options.max - count),
      reset: Math.ceil(resetTime / 1000),
      resetTime: new Date(resetTime)
    }

    // Add headers if enabled
    if (options.headers) {
      if (options.standardHeaders) {
        c.header('RateLimit-Limit', rateLimitInfo.limit.toString())
        c.header('RateLimit-Remaining', rateLimitInfo.remaining.toString())
        c.header('RateLimit-Reset', rateLimitInfo.reset.toString())
      }

      if (options.legacyHeaders) {
        c.header('X-RateLimit-Limit', rateLimitInfo.limit.toString())
        c.header('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
        c.header('X-RateLimit-Reset', rateLimitInfo.reset.toString())
      }
    }

    // Check if limit exceeded
    if (count > options.max) {
      // Call onLimitReached callback if provided
      if (options.onLimitReached) {
        await options.onLimitReached(c)
      }

      // Get error message
      const message = typeof options.message === 'function' 
        ? await options.message(c)
        : options.message

      c.status(options.statusCode)
      return c.json({ 
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      })
    }

    // Store rate limit info in context for use by other middleware/handlers
    c.set('rateLimit', rateLimitInfo)

    await next()
  }
}

/**
 * Predefined rate limiting configurations
 */
export const RATE_LIMIT_CONFIGS = {
  /**
   * Very strict rate limiting (for sensitive endpoints)
   */
  strict: (): RateLimitConfig => ({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many requests to this sensitive endpoint. Please try again later.',
    statusCode: 429
  }),

  /**
   * Standard rate limiting (for general API usage)
   */
  standard: (): RateLimitConfig => ({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later.',
    statusCode: 429
  }),

  /**
   * Generous rate limiting (for public endpoints)
   */
  generous: (): RateLimitConfig => ({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: 'Rate limit exceeded. Please try again later.',
    statusCode: 429
  }),

  /**
   * Per-minute rate limiting
   */
  perMinute: (max: number): RateLimitConfig => ({
    windowMs: 60 * 1000, // 1 minute
    max,
    message: `Too many requests. Maximum ${max} requests per minute allowed.`,
    statusCode: 429
  }),

  /**
   * Per-hour rate limiting
   */
  perHour: (max: number): RateLimitConfig => ({
    windowMs: 60 * 60 * 1000, // 1 hour
    max,
    message: `Too many requests. Maximum ${max} requests per hour allowed.`,
    statusCode: 429
  }),

  /**
   * Per-day rate limiting
   */
  perDay: (max: number): RateLimitConfig => ({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max,
    message: `Daily rate limit exceeded. Maximum ${max} requests per day allowed.`,
    statusCode: 429
  }),

  /**
   * Authentication endpoint rate limiting
   */
  auth: (): RateLimitConfig => ({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
    statusCode: 429,
    keyGenerator: (c: Context) => {
      // Use email/username if available, otherwise fall back to IP
      const body = c.req.json?.() || {}
      const identifier = body.email || body.username
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
      return identifier ? `auth:${identifier}` : `auth:ip:${ip}`
    }
  }),

  /**
   * API key based rate limiting
   */
  apiKey: (max: number, windowMs: number = 60 * 60 * 1000): RateLimitConfig => ({
    windowMs,
    max,
    message: 'API rate limit exceeded for your key.',
    statusCode: 429,
    keyGenerator: (c: Context) => {
      const apiKey = c.req.header('x-api-key') || c.req.header('authorization')?.replace('Bearer ', '')
      return apiKey ? `api:${apiKey}` : 'api:unknown'
    }
  }),

  /**
   * User-based rate limiting (requires authentication)
   */
  perUser: (max: number, windowMs: number = 15 * 60 * 1000): RateLimitConfig => ({
    windowMs,
    max,
    message: 'User rate limit exceeded.',
    statusCode: 429,
    keyGenerator: (c: Context) => {
      const user = c.get('user')
      return user?.id ? `user:${user.id}` : 'user:anonymous'
    }
  })
}

/**
 * Create tiered rate limiting based on user role/plan
 */
export function createTieredRateLimit(
  tiers: Record<string, { max: number; windowMs: number }>,
  defaultTier: string = 'free'
) {
  return (c: Context) => {
    const user = c.get('user')
    const userTier = user?.plan || user?.role || defaultTier
    const tierConfig = tiers[userTier] || tiers[defaultTier]

    return createRateLimitMiddleware({
      ...tierConfig,
      keyGenerator: (c: Context) => {
        const user = c.get('user')
        return user?.id ? `tier:${userTier}:${user.id}` : `tier:${userTier}:anonymous`
      },
      message: `Rate limit exceeded for ${userTier} plan. Upgrade for higher limits.`
    })
  }
}

/**
 * Create sliding window rate limiter
 */
export function createSlidingWindowRateLimit(config: RateLimitConfig & {
  windowSize?: number // Number of sub-windows
}) {
  const windowSize = config.windowSize || 10
  const subWindowMs = (config.windowMs || DEFAULT_RATE_LIMIT_CONFIG.windowMs) / windowSize

  return createRateLimitMiddleware({
    ...config,
    store: new SlidingWindowStore(config.store || new MemoryRateLimitStore(), windowSize, subWindowMs)
  })
}

/**
 * Sliding window store implementation
 */
class SlidingWindowStore implements RateLimitStore {
  constructor(
    private baseStore: RateLimitStore,
    private windowSize: number,
    private subWindowMs: number
  ) {}

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const now = Date.now()
    const currentWindow = Math.floor(now / this.subWindowMs)
    let totalCount = 0

    for (let i = 0; i < this.windowSize; i++) {
      const windowKey = `${key}:${currentWindow - i}`
      const windowData = await this.baseStore.get(windowKey)
      if (windowData && windowData.resetTime > now) {
        totalCount += windowData.count
      }
    }

    return {
      count: totalCount,
      resetTime: (currentWindow + 1) * this.subWindowMs
    }
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void> {
    const now = Date.now()
    const currentWindow = Math.floor(now / this.subWindowMs)
    const windowKey = `${key}:${currentWindow}`
    await this.baseStore.set(windowKey, value, ttl)
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now()
    const currentWindow = Math.floor(now / this.subWindowMs)
    const windowKey = `${key}:${currentWindow}`
    
    await this.baseStore.increment(windowKey, ttl)
    return this.get(key) as Promise<{ count: number; resetTime: number }>
  }

  async reset(key: string): Promise<void> {
    const now = Date.now()
    const currentWindow = Math.floor(now / this.subWindowMs)
    
    for (let i = 0; i < this.windowSize; i++) {
      const windowKey = `${key}:${currentWindow - i}`
      await this.baseStore.reset(windowKey)
    }
  }
}

/**
 * Usage examples
 */
export const RATE_LIMIT_EXAMPLES = {
  basic: `// Basic rate limiting
import { createRateLimitMiddleware } from './rate-limiting.template'

const app = new Hono()

// Apply rate limiting to all routes
app.use('*', createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
}))`,

  perEndpoint: `// Different rate limits per endpoint
import { createRateLimitMiddleware, RATE_LIMIT_CONFIGS } from './rate-limiting.template'

const app = new Hono()

// Strict rate limiting for auth endpoints
app.use('/api/auth/*', createRateLimitMiddleware(RATE_LIMIT_CONFIGS.auth()))

// Standard rate limiting for API endpoints
app.use('/api/*', createRateLimitMiddleware(RATE_LIMIT_CONFIGS.standard()))

// Generous rate limiting for public endpoints
app.use('/public/*', createRateLimitMiddleware(RATE_LIMIT_CONFIGS.generous()))`,

  tiered: `// Tiered rate limiting based on user plan
import { createTieredRateLimit } from './rate-limiting.template'

const app = new Hono()

const tierLimits = {
  free: { max: 100, windowMs: 60 * 60 * 1000 }, // 100/hour
  pro: { max: 1000, windowMs: 60 * 60 * 1000 }, // 1000/hour
  enterprise: { max: 10000, windowMs: 60 * 60 * 1000 } // 10000/hour
}

app.use('/api/*', createTieredRateLimit(tierLimits))`,

  redis: `// Redis-backed rate limiting
import { createRateLimitMiddleware, RedisRateLimitStore } from './rate-limiting.template'
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)
const store = new RedisRateLimitStore(redis)

const app = new Hono()

app.use('*', createRateLimitMiddleware({
  store,
  windowMs: 15 * 60 * 1000,
  max: 100
}))`
}

export default {
  createRateLimitMiddleware,
  createTieredRateLimit,
  createSlidingWindowRateLimit,
  MemoryRateLimitStore,
  RedisRateLimitStore,
  RATE_LIMIT_CONFIGS,
  DEFAULT_RATE_LIMIT_CONFIG
}