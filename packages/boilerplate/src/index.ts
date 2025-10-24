import {
  configureOpenAPI,
  createRouter,
  enhancedSecurityHeaders,
  notFound,
  onError,
  requestValidation,
  simpleRateLimit,
} from '@g-1/core'
import { generateUUID } from '@g-1/util'
import type { Context, Next } from 'hono'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { parseEnv } from './env'

// Create the main application
const app = createRouter()

// Configure OpenAPI documentation
configureOpenAPI(app)

// CORS configuration
const CORS_OPTS = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://api.g1.studio'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

// Request validation configuration
const REQUEST_VALIDATION_OPTS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedContentTypes: [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
  ],
}

// Environment parsing middleware
app.use((c: Context, next: Next) => {
  if (c.req.path.startsWith('/__test__/')) return next()

  const isTest = process.env.NODE_ENV === 'test'
  if (isTest && c.env) {
    const processEnvOnly = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => !(key in c.env))
    )
    c.env = parseEnv(Object.assign({}, processEnvOnly, c.env))
  } else {
    c.env = parseEnv(Object.assign(c.env || {}, process.env))
  }
  return next()
})

// Middleware setup (ordered by performance impact)
app.use(contextStorage())
app.use(requestId({ generator: () => generateUUID() }))
app.use(enhancedSecurityHeaders())
app.use(requestValidation(REQUEST_VALIDATION_OPTS))
app.use('*', cors(CORS_OPTS))

// Rate limiting (skip in test environment)
const isTest = process.env.NODE_ENV === 'test'
const isDevelopment = process.env.NODE_ENV === 'development'

if (!isTest) {
  app.use(
    '/api/*',
    simpleRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: isDevelopment ? 1000 : 100,
      message: 'Too many API requests from this IP, please try again later.',
    })
  )

  app.use(
    '/api/auth/*',
    simpleRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: isDevelopment ? 200 : 20,
      message: 'Too many authentication requests from this IP, please try again later.',
    })
  )
}

// Logging (disabled in test for performance)
if (!isTest) {
  app.use(logger())
}

// Health check endpoint
app.get('/health', (c: Context) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Basic API endpoint
app.get('/api/hello', (c: Context) => {
  return c.json({ message: 'Hello from G1 API Framework!' })
})

// Error handlers
app.notFound(notFound)
app.onError(onError)

export default app
