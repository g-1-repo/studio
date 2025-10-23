import type { Schema } from 'hono'

import type { AppBindings, AppOpenAPI } from './types'
import process from 'node:process'
import { OpenAPIHono } from '@hono/zod-openapi'
import { contextStorage } from 'hono/context-storage'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { parseEnv } from '@/env'
import { defaultHook } from '@/lib/utils/openapi'
import { enhancedSecurityHeaders, notFound, onError, requestValidation, simpleRateLimit } from '@/middleware'
import { authManagement } from '@/middleware/auth.middleware'
import favIcon from '@/middleware/favicon'
import { pinoLogger } from '@/middleware/pino-logger'
import { sessionManagement } from '@/middleware/session-management.middleware'
import { registerTestRoutes } from './register-test-routes'
import { getHomepageVariables, TemplateRenderer } from './templates/renderer'

import { generateId } from './utils/crypto'

// Reusable constants allocated once per process
const REQUEST_VALIDATION_OPTS = {
  maxBodySize: 2 * 1024 * 1024, // 2MB limit
  allowedContentTypes: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
  requireContentType: false, // Don't require for GET requests
}

const CORS_OPTS = {
  origin: ['http://localhost:5173', 'http://localhost:8787'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
  exposeHeaders: ['Content-Length'],
  credentials: true,
}

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  })
}

export default function createApp() {
  const app = createRouter()

  // OPTIMIZATION: Order middleware by frequency and performance impact
  // 1. Fast, lightweight middleware first (favicon, health checks)
  app.use('/favicon.ico', favIcon())

  // 2. Health check - should be fast and not require auth
  app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // 3. Environment parsing - lightweight but needed early (skip for test helper routes)
  app.use((c, next) => {
    if (c.req.path.startsWith('/__test__/'))
      return next()

    // In test environment, preserve existing bindings (like DB from cloudflare:test)
    // and only merge in process.env values that don't override existing bindings
    const isTest = process.env.NODE_ENV === 'test'
    if (isTest && c.env) {
      // For tests, preserve the cloudflare:test bindings and only add missing env vars
      const processEnvOnly = Object.fromEntries(
        Object.entries(process.env).filter(([key]) => !(key in c.env)),
      )
      c.env = parseEnv(Object.assign({}, processEnvOnly, c.env))
    }
    else {
      c.env = parseEnv(Object.assign(c.env || {}, process.env))
    }
    return next()
  })

  // 4. Context storage - needed for logging and request tracking
  app.use(contextStorage())
  app.use(requestId({ generator: () => generateId() }))

  // 5. Security headers - lightweight security enhancement
  app.use(enhancedSecurityHeaders())

  // 6. Request validation - validate request size and content type early
  app.use(requestValidation(REQUEST_VALIDATION_OPTS))

  // 7. CORS - important for security, relatively lightweight
  app.use('*', cors(CORS_OPTS))

  // 8. Rate limiting - protect API endpoints (development-friendly limits)
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTest = process.env.NODE_ENV === 'test'

  if (!isTest) {
    app.use('/api/*', simpleRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: isDevelopment ? 1000 : 100, // Higher limit in development
      message: 'Too many API requests from this IP, please try again later.',
    }))

    // More restrictive rate limiting for auth endpoints
    app.use('/api/auth/*', simpleRateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: isDevelopment ? 200 : 20, // Higher limit in development
      message: 'Too many authentication requests from this IP, please try again later.',
    }))
  }

  // 9. Logging - after context is set up (disabled in test for performance)
  if (!isTest)
    app.use(pinoLogger())

  // 10. Auth middleware - only where needed
  app.use('/api/*', authManagement)
  app.use('/protected', authManagement)
  app.use('/api/*', sessionManagement)
  app.use('/protected', sessionManagement)
  // Test helper routes need auth/session
  app.use('/__test__/*', authManagement)
  app.use('/__test__/*', sessionManagement)

  // Test helpers: expose email outbox and error routes under __test__
  registerTestRoutes(app)

  // 11. Error handlers - should be last
  app.notFound(notFound)
  app.onError(onError)

  // Handle all auth routes
  app.all('/api/auth/*', async (c) => {
    const auth = c.get('auth')
    return auth.handler(c.req.raw)
  })

  // Modern API homepage with documentation portal
  app.get('/', async (c) => {
    try {
      const variables = getHomepageVariables()
      // Use request URL for BASE_URL in production
      variables.BASE_URL = `${new URL(c.req.url).protocol}//${new URL(c.req.url).host}`

      const html = TemplateRenderer.render('homepage', variables)
      return c.html(html)
    }
    catch (error) {
      console.error('Homepage rendering error:', error)
      // Fallback to simple homepage
      const variables = getHomepageVariables()
      const fallbackHtml = TemplateRenderer.render('fallback', variables)
      return c.html(fallbackHtml)
    }
  })

  // Legacy dashboard for authentication testing (moved from homepage)
  app.get('/dashboard', async (c) => {
    const { DASHBOARD_HTML } = await import('./static/dashboard')
    return c.html(DASHBOARD_HTML)
  })

  // Protected route that shows different content based on auth status
  app.get('/protected', async (c) => {
    try {
      const user = c.get('user') as any
      const session = c.get('session') as any

      if (session && user) {
        const content = `
          <h2>🔒 Protected Content - You're In!</h2>
          <p>Welcome to the protected area!</p>
          <p><strong>User ID:</strong> ${user.id}</p>
          <p><strong>Session ID:</strong> ${session.id}</p>
          <p><strong>Created At:</strong> ${new Date(user.createdAt).toLocaleString()}</p>
          <p>This content is only visible to authenticated users (including anonymous ones)!</p>
        `
        return c.html(content)
      }
      else {
        return c.html(
          `
                <h2>❌ Access Denied</h2>
                <p>You need to be logged in to see this content.</p>
                <p>Go back and login anonymously first!</p>
            `,
          401,
        )
      }
    }
    catch (error) {
      return c.html(
        `
            <h2>❌ Error</h2>
            <p>Error checking authentication: ${(error as Error).message}</p>
        `,
        500,
      )
    }
  })

  return app
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createApp().route('/', router)
}
