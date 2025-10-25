import type { Context, Next } from 'hono'

/**
 * CORS (Cross-Origin Resource Sharing) middleware templates
 */

export interface CORSConfig {
  origin?:
    | string
    | string[]
    | boolean
    | ((origin: string, c: Context) => boolean | Promise<boolean>)
  allowMethods?: string[]
  allowHeaders?: string[]
  exposeHeaders?: string[]
  credentials?: boolean
  maxAge?: number
  optionsSuccessStatus?: number
  preflightContinue?: boolean
}

/**
 * Default CORS configuration
 */
export const DEFAULT_CORS_CONFIG: CORSConfig = {
  origin: true,
  allowMethods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
  preflightContinue: false,
}

/**
 * Create CORS middleware
 */
export function createCORSMiddleware(config: CORSConfig = {}) {
  const options = { ...DEFAULT_CORS_CONFIG, ...config }

  return async (c: Context, next: Next) => {
    const origin = c.req.header('Origin')
    const _requestMethod = c.req.header('Access-Control-Request-Method')
    const requestHeaders = c.req.header('Access-Control-Request-Headers')

    // Handle origin
    if (await isOriginAllowed(origin, options.origin, c)) {
      if (origin) {
        c.header('Access-Control-Allow-Origin', origin)
      } else if (options.origin === true) {
        c.header('Access-Control-Allow-Origin', '*')
      } else if (typeof options.origin === 'string') {
        c.header('Access-Control-Allow-Origin', options.origin)
      }
    }

    // Handle credentials
    if (options.credentials) {
      c.header('Access-Control-Allow-Credentials', 'true')
    }

    // Handle preflight requests
    if (c.req.method === 'OPTIONS') {
      // Allow methods
      if (options.allowMethods && options.allowMethods.length > 0) {
        c.header('Access-Control-Allow-Methods', options.allowMethods.join(', '))
      }

      // Allow headers
      if (requestHeaders && options.allowHeaders) {
        const allowedHeaders = options.allowHeaders.join(', ')
        c.header('Access-Control-Allow-Headers', allowedHeaders)
      } else if (requestHeaders) {
        c.header('Access-Control-Allow-Headers', requestHeaders)
      }

      // Max age
      if (options.maxAge) {
        c.header('Access-Control-Max-Age', options.maxAge.toString())
      }

      // Handle preflight response
      if (!options.preflightContinue) {
        c.status((options.optionsSuccessStatus || 204) as any)
        return c.body(null)
      }
    }

    // Expose headers for actual requests
    if (options.exposeHeaders && options.exposeHeaders.length > 0) {
      c.header('Access-Control-Expose-Headers', options.exposeHeaders.join(', '))
    }

    await next()
  }
}

/**
 * Check if origin is allowed
 */
async function isOriginAllowed(
  origin: string | undefined,
  allowedOrigin: CORSConfig['origin'],
  c: Context
): Promise<boolean> {
  if (!origin) return true

  if (allowedOrigin === true) return true
  if (allowedOrigin === false) return false

  if (typeof allowedOrigin === 'string') {
    return origin === allowedOrigin
  }

  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin)
  }

  if (typeof allowedOrigin === 'function') {
    return await allowedOrigin(origin, c)
  }

  return false
}

/**
 * Predefined CORS configurations
 */
export const CORS_CONFIGS = {
  /**
   * Allow all origins (development only)
   */
  allowAll: (): CORSConfig => ({
    origin: true,
    credentials: true,
    allowMethods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposeHeaders: ['X-Total-Count', 'X-Page-Count'],
  }),

  /**
   * Strict CORS for production
   */
  strict: (allowedOrigins: string[]): CORSConfig => ({
    origin: allowedOrigins,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),

  /**
   * API-only CORS (no credentials)
   */
  apiOnly: (allowedOrigins: string[]): CORSConfig => ({
    origin: allowedOrigins,
    credentials: false,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  }),

  /**
   * Development CORS with specific domains
   */
  development: (): CORSConfig => ({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
    allowMethods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),

  /**
   * Mobile app CORS
   */
  mobileApp: (): CORSConfig => ({
    origin: false, // Mobile apps don't send Origin header
    credentials: false,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-App-Version', 'X-Device-ID'],
  }),

  /**
   * Webhook CORS (very restrictive)
   */
  webhook: (): CORSConfig => ({
    origin: false,
    credentials: false,
    allowMethods: ['POST'],
    allowHeaders: ['Content-Type', 'X-Webhook-Signature'],
  }),
}

/**
 * Environment-based CORS configuration
 */
export function createEnvironmentCORS(): CORSConfig {
  const env = process.env.NODE_ENV || 'development'

  switch (env) {
    case 'production': {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
      return CORS_CONFIGS.strict(allowedOrigins)
    }

    case 'staging': {
      const stagingOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
        'https://staging.example.com',
        'https://preview.example.com',
      ]
      return CORS_CONFIGS.strict(stagingOrigins)
    }
    default:
      return CORS_CONFIGS.development()
  }
}

/**
 * Dynamic CORS based on request context
 */
export function createDynamicCORS(
  originValidator: (origin: string, c: Context) => boolean | Promise<boolean>
): CORSConfig {
  return {
    origin: originValidator,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  }
}

/**
 * CORS middleware with domain whitelist from database
 */
export function createDatabaseCORS(getDomains: () => Promise<string[]>) {
  return createCORSMiddleware({
    origin: async (origin: string, _c: Context) => {
      try {
        const allowedDomains = await getDomains()
        return allowedDomains.includes(origin)
      } catch (error) {
        console.error('Failed to fetch allowed domains:', error)
        return false
      }
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
}

/**
 * CORS middleware with subdomain support
 */
export function createSubdomainCORS(baseDomain: string): CORSConfig {
  return {
    origin: (origin: string) => {
      if (!origin) return false

      try {
        const url = new URL(origin)
        const hostname = url.hostname

        // Allow exact match
        if (hostname === baseDomain) return true

        // Allow subdomains
        if (hostname.endsWith(`.${baseDomain}`)) return true

        return false
      } catch {
        return false
      }
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }
}

/**
 * Usage examples
 */
export const CORS_EXAMPLES = {
  basic: `// Basic CORS setup
import { createCORSMiddleware } from './cors.template'

const app = new Hono()

// Allow all origins (development only)
app.use('*', createCORSMiddleware({
  origin: true,
  credentials: true
}))`,

  production: `// Production CORS setup
import { createCORSMiddleware, CORS_CONFIGS } from './cors.template'

const app = new Hono()

// Strict CORS for production
app.use('*', createCORSMiddleware(
  CORS_CONFIGS.strict(['https://myapp.com', 'https://www.myapp.com'])
))`,

  environment: `// Environment-based CORS
import { createCORSMiddleware, createEnvironmentCORS } from './cors.template'

const app = new Hono()

// Automatically configure based on NODE_ENV
app.use('*', createCORSMiddleware(createEnvironmentCORS()))`,

  dynamic: `// Dynamic CORS with custom validation
import { createCORSMiddleware, createDynamicCORS } from './cors.template'

const app = new Hono()

// Custom origin validation
app.use('*', createCORSMiddleware(
  createDynamicCORS(async (origin, c) => {
    // Custom logic to validate origin
    const user = c.get('user')
    if (user?.role === 'admin') return true
    
    const allowedOrigins = await getAllowedOrigins(user?.id)
    return allowedOrigins.includes(origin)
  })
))`,

  subdomain: `// Subdomain CORS support
import { createCORSMiddleware, createSubdomainCORS } from './cors.template'

const app = new Hono()

// Allow all subdomains of example.com
app.use('*', createCORSMiddleware(
  createSubdomainCORS('example.com')
))`,
}

export default {
  createCORSMiddleware,
  CORS_CONFIGS,
  createEnvironmentCORS,
  createDynamicCORS,
  createDatabaseCORS,
  createSubdomainCORS,
  DEFAULT_CORS_CONFIG,
}
