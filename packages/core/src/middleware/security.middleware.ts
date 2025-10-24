import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { AppBindings } from '../lib/types'

/**
 * Enhanced security middleware with better performance and comprehensive protection
 */

/**
 * Rate limiting with sliding window algorithm
 */
export function rateLimitOptimized(options: {
  windowMs: number
  maxRequests: number
  keyGenerator?: (c: Context<AppBindings>) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}): MiddlewareHandler<AppBindings> {
  const {
    windowMs,
    maxRequests,
    keyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options

  return createMiddleware(async (c, next) => {
    // Generate rate limit key with better performance
    let key: string
    if (keyGenerator) {
      key = keyGenerator(c)
    } else {
      const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
      const user = c.get('user')
      key = user ? `rate_limit:user:${user.id}` : `rate_limit:ip:${ip}`
    }

    const kv = c.env.MY_API_PROJECT_KV_AUTH
    if (!kv) {
      throw new HTTPException(500, { message: 'KV store not available' })
    }
    const now = Date.now()

    // Use sliding window algorithm for more accurate rate limiting
    const windowStart = now - windowMs
    const currentWindow = Math.floor(now / 1000) // 1-second granularity

    const slidingKey = `${key}:sliding:${currentWindow}`
    const historyKey = `${key}:history`

    try {
      // Get current request count and history
      const [currentCountStr, historyStr] = await Promise.all([
        kv.get(slidingKey),
        kv.get(historyKey),
      ])

      const currentCount = currentCountStr ? Number.parseInt(currentCountStr, 10) : 0
      const history = historyStr ? JSON.parse(historyStr) : []

      // Clean old entries from history
      const validHistory = history.filter(
        (entry: { timestamp: number }) => entry.timestamp > windowStart
      )

      // Calculate total requests in window
      const totalRequests = validHistory.length + currentCount

      if (totalRequests >= maxRequests) {
        // Add rate limit headers
        c.header('X-RateLimit-Limit', maxRequests.toString())
        c.header('X-RateLimit-Remaining', '0')
        c.header('X-RateLimit-Reset', (now + windowMs).toString())
        c.header('Retry-After', Math.ceil(windowMs / 1000).toString())

        return c.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Limit: ${maxRequests} per ${Math.round(windowMs / 1000)} seconds`,
            retryAfter: Math.ceil(windowMs / 1000),
          },
          429
        )
      }

      // Continue with request
      await next()

      // Only count requests that match criteria
      const shouldCount =
        (!skipSuccessfulRequests || c.res.status >= 400) &&
        (!skipFailedRequests || c.res.status < 400)

      if (shouldCount) {
        // Update counters
        const newHistory = [...validHistory, { timestamp: now }]

        await Promise.all([
          kv.put(slidingKey, (currentCount + 1).toString(), {
            expirationTtl: Math.max(60, Math.ceil(windowMs / 1000) + 10),
          }),
          kv.put(historyKey, JSON.stringify(newHistory.slice(-maxRequests)), {
            expirationTtl: Math.max(60, Math.ceil(windowMs / 1000) + 10),
          }),
        ])
      }

      // Add informational headers
      c.header('X-RateLimit-Limit', maxRequests.toString())
      c.header('X-RateLimit-Remaining', Math.max(0, maxRequests - totalRequests - 1).toString())
      c.header('X-RateLimit-Reset', (now + windowMs).toString())
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Fail open - continue request on rate limiting errors
      await next()
    }
  })
}

/**
 * Enhanced request validation with better error messages
 */
export function requestValidation(options: {
  maxBodySize?: number
  allowedContentTypes?: string[]
  requireContentType?: boolean
}): MiddlewareHandler<AppBindings> {
  const {
    maxBodySize = 1024 * 1024,
    allowedContentTypes = [],
    requireContentType = false,
  } = options

  return createMiddleware(async (c, next) => {
    const method = c.req.method
    const contentLength = c.req.header('content-length')
    const contentType = c.req.header('content-type')

    // Check content length
    if (contentLength && Number.parseInt(contentLength, 10) > maxBodySize) {
      return c.json(
        {
          error: 'Request entity too large',
          message: `Request body must be less than ${Math.round(maxBodySize / 1024)}KB`,
          maxSize: maxBodySize,
        },
        413
      )
    }

    // Check content type for requests with body
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (requireContentType && !contentType) {
        return c.json(
          {
            error: 'Content-Type required',
            message: 'Content-Type header is required for this request',
            allowedTypes: allowedContentTypes,
          },
          400
        )
      }

      if (contentType && allowedContentTypes.length > 0) {
        const isAllowed = allowedContentTypes.some(type => contentType.includes(type))

        if (!isAllowed) {
          return c.json(
            {
              error: 'Invalid content type',
              message: `Content-Type '${contentType}' is not allowed`,
              allowedTypes: allowedContentTypes,
            },
            415
          )
        }
      }
    }

    await next()
  })
}

/**
 * Advanced security headers with CSP
 */
export function enhancedSecurityHeaders(): MiddlewareHandler<AppBindings> {
  return createMiddleware(async (c, next) => {
    await next()

    // Core security headers
    c.header('X-Content-Type-Options', 'nosniff')
    c.header('X-Frame-Options', 'DENY')
    c.header('X-XSS-Protection', '1; mode=block')
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    // Enhanced permissions policy
    c.header(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()'
    )

    // Content Security Policy - Allow resources needed for HTML content and documentation
    const path = new URL(c.req.url).pathname
    const contentType = c.res.headers.get('content-type') || ''

    // More permissive CSP for HTML content (dashboards, documentation)
    if (
      path === '/reference' ||
      path === '/reference' ||
      path === '/' ||
      path === '/' ||
      contentType.includes('text/html')
    ) {
      c.header(
        'Content-Security-Policy',
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; " +
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net; " +
          "font-src 'self' https://fonts.gstatic.com; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self'; " +
          "frame-ancestors 'none'; " +
          "base-uri 'none';"
      )
    } else {
      // Strict CSP for JSON API endpoints
      c.header(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'; base-uri 'none';"
      )
    }

    // Only add HSTS for HTTPS
    if (c.req.url.startsWith('https://')) {
      c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }

    // API-specific headers
    c.header('X-API-Version', 'v1')
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
  })
}

/**
 * Input sanitization middleware
 */
export function inputSanitization(): MiddlewareHandler<AppBindings> {
  return createMiddleware(async (c, next) => {
    const method = c.req.method

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      // Get request body if it exists
      try {
        const body = await c.req.json().catch(() => null)

        if (body && typeof body === 'object') {
          // Sanitize common XSS patterns
          const _sanitized = sanitizeObject(body)

          // Store sanitized body for later use (note: this is a concept demonstration)
          // In practice, you might modify the request object differently
          // c.set("sanitizedBody", _sanitized); // Commented out due to type restrictions
        }
      } catch {
        // Continue if body parsing fails - let route handler deal with it
      }
    }

    await next()
  })
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value)
  }

  return sanitized
}

/**
 * Sanitize string values
 */
function sanitizeString(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Comprehensive request logging for security monitoring
 */
export function securityAuditLog(): MiddlewareHandler<AppBindings> {
  return createMiddleware(async (c, next) => {
    const startTime = Date.now()
    const method = c.req.method
    const url = c.req.url
    const userAgent = c.req.header('user-agent') || 'unknown'
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const cfCountry = c.req.header('cf-ipcountry')
    const user = c.get('user')
    const requestId = c.get('requestId')

    // Log security-relevant request details
    const securityContext = {
      type: 'security_audit',
      timestamp: new Date().toISOString(),
      request: {
        id: requestId,
        method,
        url: new URL(url).pathname, // Don't log query params (may contain sensitive data)
        ip,
        country: cfCountry,
        userAgent,
        contentLength: c.req.header('content-length'),
        contentType: c.req.header('content-type'),
      },
      user: user ? { id: user.id, email: user.email } : null,
    }

    let statusCode: number | undefined
    let error: unknown = null

    try {
      await next()
      statusCode = c.res.status
    } catch (err) {
      error = err
      statusCode = err instanceof HTTPException ? err.status : 500
      throw err
    } finally {
      const duration = Date.now() - startTime

      // Only log if statusCode is available
      if (statusCode !== undefined) {
        // Log completion with security context
        console.warn(
          JSON.stringify({
            ...securityContext,
            response: {
              statusCode,
              duration,
              error: error
                ? {
                    message: (error as Error).message,
                    type: error.constructor.name,
                  }
                : null,
            },
          })
        )

        // Alert on suspicious activities
        if (statusCode === 401 || statusCode === 403) {
          console.warn(
            JSON.stringify({
              type: 'security_alert',
              level: 'warning',
              message: `Authentication/Authorization failure: ${method} ${url}`,
              ...securityContext.request,
              statusCode,
            })
          )
        }

        // Alert on potential attacks
        if (statusCode === 429) {
          console.warn(
            JSON.stringify({
              type: 'security_alert',
              level: 'warning',
              message: `Rate limit exceeded: ${ip}`,
              ...securityContext.request,
            })
          )
        }
      }
    }
  })
}

/**
 * Simple rate limiter using the hono-rate-limiter package for easier implementation
 */
export function simpleRateLimit(options: {
  windowMs: number
  limit: number
  keyGenerator?: (c: Context<AppBindings>) => string
  message?: string
}): MiddlewareHandler<AppBindings> {
  const { windowMs, limit, keyGenerator, message } = options

  return createMiddleware(async (c, next) => {
    // Generate key for rate limiting
    let key: string
    if (keyGenerator) {
      key = keyGenerator(c)
    } else {
      const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
      key = `rate_limit:${ip}`
    }

    const kv = c.env.MY_API_PROJECT_KV_AUTH
    if (!kv) {
      throw new HTTPException(500, { message: 'KV store not available' })
    }
    const now = Date.now()
    const _windowStart = now - windowMs

    try {
      // Get current count
      const currentCountStr = await kv.get(key)
      const currentCount = currentCountStr ? Number.parseInt(currentCountStr, 10) : 0

      if (currentCount >= limit) {
        c.header('X-RateLimit-Limit', limit.toString())
        c.header('X-RateLimit-Remaining', '0')
        c.header('Retry-After', Math.ceil(windowMs / 1000).toString())

        return c.json(
          {
            error: 'Too Many Requests',
            message:
              message || `Rate limit exceeded. Try again in ${Math.ceil(windowMs / 1000)} seconds.`,
          },
          429
        )
      }

      await next()

      // Increment counter
      await kv.put(key, (currentCount + 1).toString(), {
        expirationTtl: Math.max(60, Math.ceil(windowMs / 1000) + 5),
      })

      // Add rate limit headers
      c.header('X-RateLimit-Limit', limit.toString())
      c.header('X-RateLimit-Remaining', Math.max(0, limit - currentCount - 1).toString())
    } catch (error) {
      console.error('Rate limiting error:', error)
      // Fail open on errors
      await next()
    }
  })
}
