/**
 * Error tracking template for monitoring and reporting application errors
 */

export interface ErrorTrackingConfig {
  enabled: boolean
  provider: 'sentry' | 'bugsnag' | 'rollbar' | 'custom'
  dsn?: string
  apiKey?: string
  environment?: string
  release?: string
  sampleRate?: number
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null
  beforeBreadcrumb?: (breadcrumb: Breadcrumb) => Breadcrumb | null
  enablePerformanceMonitoring?: boolean
  enableSessionReplay?: boolean
  maxBreadcrumbs?: number
  attachStacktrace?: boolean
  sendDefaultPii?: boolean
}

export interface ErrorEvent {
  id: string
  timestamp: number
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  message: string
  exception?: {
    type: string
    value: string
    stacktrace?: StackFrame[]
  }
  request?: {
    method: string
    url: string
    headers: Record<string, string>
    body?: any
  }
  user?: {
    id?: string
    email?: string
    username?: string
    ip?: string
  }
  tags?: Record<string, string>
  extra?: Record<string, any>
  breadcrumbs?: Breadcrumb[]
  fingerprint?: string[]
  environment?: string
  release?: string
}

export interface StackFrame {
  filename: string
  function: string
  lineno: number
  colno: number
  context_line?: string
  pre_context?: string[]
  post_context?: string[]
}

export interface Breadcrumb {
  timestamp: number
  type: 'default' | 'http' | 'navigation' | 'user' | 'error' | 'debug'
  category?: string
  message?: string
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug'
  data?: Record<string, any>
}

export interface ErrorTracker {
  captureException(error: Error, context?: Partial<ErrorEvent>): string
  captureMessage(
    message: string,
    level?: ErrorEvent['level'],
    context?: Partial<ErrorEvent>
  ): string
  addBreadcrumb(breadcrumb: Breadcrumb): void
  setUser(user: ErrorEvent['user']): void
  setTag(key: string, value: string): void
  setExtra(key: string, value: any): void
  setContext(name: string, context: Record<string, any>): void
  flush(timeout?: number): Promise<boolean>
}

export const DEFAULT_ERROR_TRACKING_CONFIG: ErrorTrackingConfig = {
  enabled: true,
  provider: 'sentry',
  environment: process.env.NODE_ENV || 'development',
  sampleRate: 1.0,
  enablePerformanceMonitoring: false,
  enableSessionReplay: false,
  maxBreadcrumbs: 100,
  attachStacktrace: true,
  sendDefaultPii: false,
}

export class SentryErrorTracker implements ErrorTracker {
  private config: ErrorTrackingConfig
  private breadcrumbs: Breadcrumb[] = []
  private user?: ErrorEvent['user']
  private tags: Record<string, string> = {}
  private extra: Record<string, any> = {}
  private contexts: Record<string, Record<string, any>> = {}

  constructor(config: ErrorTrackingConfig) {
    this.config = config
  }

  captureException(error: Error, context?: Partial<ErrorEvent>): string {
    const eventId = this.generateEventId()

    const errorEvent: ErrorEvent = {
      id: eventId,
      timestamp: Date.now(),
      level: 'error',
      message: error.message,
      exception: {
        type: error.name,
        value: error.message,
        stacktrace: this.parseStackTrace(error.stack),
      },
      user: this.user,
      tags: { ...this.tags, ...context?.tags },
      extra: { ...this.extra, ...context?.extra },
      breadcrumbs: [...this.breadcrumbs],
      environment: this.config.environment,
      release: this.config.release,
      ...context,
    }

    this.sendEvent(errorEvent)
    return eventId
  }

  captureMessage(
    message: string,
    level: ErrorEvent['level'] = 'info',
    context?: Partial<ErrorEvent>
  ): string {
    const eventId = this.generateEventId()

    const errorEvent: ErrorEvent = {
      id: eventId,
      timestamp: Date.now(),
      level,
      message,
      user: this.user,
      tags: { ...this.tags, ...context?.tags },
      extra: { ...this.extra, ...context?.extra },
      breadcrumbs: [...this.breadcrumbs],
      environment: this.config.environment,
      release: this.config.release,
      ...context,
    }

    this.sendEvent(errorEvent)
    return eventId
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    if (this.config.beforeBreadcrumb) {
      const processedBreadcrumb = this.config.beforeBreadcrumb(breadcrumb)
      if (!processedBreadcrumb) return
      breadcrumb = processedBreadcrumb
    }

    this.breadcrumbs.push(breadcrumb)

    if (this.breadcrumbs.length > (this.config.maxBreadcrumbs || 100)) {
      this.breadcrumbs.shift()
    }
  }

  setUser(user: ErrorEvent['user']): void {
    this.user = user
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value
  }

  setExtra(key: string, value: any): void {
    this.extra[key] = value
  }

  setContext(name: string, context: Record<string, any>): void {
    this.contexts[name] = context
  }

  async flush(timeout = 5000): Promise<boolean> {
    // In a real implementation, this would flush pending events
    return new Promise(resolve => {
      setTimeout(() => resolve(true), Math.min(timeout, 100))
    })
  }

  private generateEventId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private parseStackTrace(stack?: string): StackFrame[] {
    if (!stack) return []

    return stack
      .split('\n')
      .slice(1) // Remove the error message line
      .map(line => {
        const match =
          line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) || line.match(/at\s+(.+?):(\d+):(\d+)/)

        if (match) {
          return {
            function: match[1] || 'anonymous',
            filename: match[2] || match[1] || 'unknown',
            lineno: parseInt(match[3] || match[2] || '0', 10),
            colno: parseInt(match[4] || match[3] || '0', 10),
          }
        }

        return {
          function: 'unknown',
          filename: 'unknown',
          lineno: 0,
          colno: 0,
        }
      })
      .filter(frame => frame.filename !== 'unknown')
  }

  private async sendEvent(event: ErrorEvent): Promise<void> {
    if (!this.config.enabled || !this.config.dsn) return

    // Apply beforeSend filter
    if (this.config.beforeSend) {
      const processedEvent = this.config.beforeSend(event)
      if (!processedEvent) return
      event = processedEvent
    }

    // Apply sampling
    if (Math.random() > (this.config.sampleRate || 1.0)) return

    try {
      const response = await fetch(this.config.dsn, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': this.buildAuthHeader(),
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        console.error('Failed to send error event:', response.statusText)
      }
    } catch (error) {
      console.error('Error sending event to Sentry:', error)
    }
  }

  private buildAuthHeader(): string {
    return `Sentry sentry_version=7, sentry_client=custom/1.0.0, sentry_key=${this.config.apiKey}`
  }
}

export class CustomErrorTracker implements ErrorTracker {
  private config: ErrorTrackingConfig
  private breadcrumbs: Breadcrumb[] = []
  private user?: ErrorEvent['user']
  private tags: Record<string, string> = {}
  private extra: Record<string, any> = {}

  constructor(config: ErrorTrackingConfig) {
    this.config = config
  }

  captureException(error: Error, context?: Partial<ErrorEvent>): string {
    const eventId = this.generateEventId()

    const errorEvent: ErrorEvent = {
      id: eventId,
      timestamp: Date.now(),
      level: 'error',
      message: error.message,
      exception: {
        type: error.name,
        value: error.message,
      },
      user: this.user,
      tags: { ...this.tags, ...context?.tags },
      extra: { ...this.extra, ...context?.extra },
      breadcrumbs: [...this.breadcrumbs],
      environment: this.config.environment,
      ...context,
    }

    this.logEvent(errorEvent)
    return eventId
  }

  captureMessage(
    message: string,
    level: ErrorEvent['level'] = 'info',
    context?: Partial<ErrorEvent>
  ): string {
    const eventId = this.generateEventId()

    const errorEvent: ErrorEvent = {
      id: eventId,
      timestamp: Date.now(),
      level,
      message,
      user: this.user,
      tags: { ...this.tags, ...context?.tags },
      extra: { ...this.extra, ...context?.extra },
      breadcrumbs: [...this.breadcrumbs],
      environment: this.config.environment,
      ...context,
    }

    this.logEvent(errorEvent)
    return eventId
  }

  addBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb)

    if (this.breadcrumbs.length > (this.config.maxBreadcrumbs || 100)) {
      this.breadcrumbs.shift()
    }
  }

  setUser(user: ErrorEvent['user']): void {
    this.user = user
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value
  }

  setExtra(key: string, value: any): void {
    this.extra[key] = value
  }

  setContext(_name: string, _context: Record<string, any>): void {
    // Custom implementation can store contexts as needed
  }

  async flush(_timeout = 5000): Promise<boolean> {
    return true
  }

  private generateEventId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private logEvent(event: ErrorEvent): void {
    // Custom logging implementation
    console.error(`[${event.level.toUpperCase()}] ${event.message}`, {
      id: event.id,
      timestamp: new Date(event.timestamp).toISOString(),
      user: event.user,
      tags: event.tags,
      extra: event.extra,
      breadcrumbs: event.breadcrumbs?.slice(-5), // Last 5 breadcrumbs
    })
  }
}

export function createErrorTracker(config: ErrorTrackingConfig): ErrorTracker {
  switch (config.provider) {
    case 'sentry':
      return new SentryErrorTracker(config)
    case 'custom':
      return new CustomErrorTracker(config)
    default:
      return new CustomErrorTracker(config)
  }
}

export function createErrorTrackingMiddleware(
  config: ErrorTrackingConfig = DEFAULT_ERROR_TRACKING_CONFIG
) {
  if (!config.enabled) {
    return (_c: any, next: any) => next()
  }

  const errorTracker = createErrorTracker(config)

  return async (c: any, next: any) => {
    // Add request breadcrumb
    errorTracker.addBreadcrumb({
      timestamp: Date.now(),
      type: 'http',
      category: 'request',
      message: `${c.req.method} ${c.req.path}`,
      data: {
        method: c.req.method,
        url: c.req.path,
        headers: Object.fromEntries(c.req.headers.entries()),
      },
    })

    // Set request context
    errorTracker.setExtra('request', {
      method: c.req.method,
      url: c.req.path,
      headers: Object.fromEntries(c.req.headers.entries()),
      query: c.req.query,
    })

    try {
      await next()

      // Add response breadcrumb for errors
      if (c.res.status >= 400) {
        errorTracker.addBreadcrumb({
          timestamp: Date.now(),
          type: 'http',
          category: 'response',
          level: c.res.status >= 500 ? 'error' : 'warning',
          message: `Response ${c.res.status}`,
          data: {
            status: c.res.status,
            statusText: c.res.statusText,
          },
        })
      }
    } catch (error) {
      // Capture the error
      const eventId = errorTracker.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          request: {
            method: c.req.method,
            url: c.req.path,
            headers: Object.fromEntries(c.req.headers.entries()),
          },
          tags: {
            endpoint: c.req.path,
            method: c.req.method,
          },
        }
      )

      // Add error ID to response headers for debugging
      c.header('X-Error-ID', eventId)

      throw error
    }
  }
}

// Predefined error tracking configurations
export const ERROR_TRACKING_CONFIGS = {
  development: {
    ...DEFAULT_ERROR_TRACKING_CONFIG,
    provider: 'custom' as const,
    sampleRate: 1.0,
    enablePerformanceMonitoring: false,
  } as ErrorTrackingConfig,

  production: {
    ...DEFAULT_ERROR_TRACKING_CONFIG,
    provider: 'sentry' as const,
    sampleRate: 0.1, // Sample 10% of errors in production
    enablePerformanceMonitoring: true,
    sendDefaultPii: false,
  } as ErrorTrackingConfig,

  staging: {
    ...DEFAULT_ERROR_TRACKING_CONFIG,
    provider: 'sentry' as const,
    sampleRate: 0.5,
    enablePerformanceMonitoring: true,
  } as ErrorTrackingConfig,

  minimal: {
    ...DEFAULT_ERROR_TRACKING_CONFIG,
    provider: 'custom' as const,
    maxBreadcrumbs: 10,
    attachStacktrace: false,
  } as ErrorTrackingConfig,
}

// Helper functions for common error tracking patterns
export const ERROR_TRACKING_HELPERS = {
  // Wrap async functions with error tracking
  wrapAsync: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    tracker: ErrorTracker,
    context?: Partial<ErrorEvent>
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args)
      } catch (error) {
        tracker.captureException(error instanceof Error ? error : new Error(String(error)), context)
        throw error
      }
    }) as T
  },

  // Create performance monitoring wrapper
  withPerformanceTracking: <T extends (...args: any[]) => any>(
    name: string,
    fn: T,
    tracker: ErrorTracker
  ): T => {
    return ((...args: Parameters<T>) => {
      const start = Date.now()

      tracker.addBreadcrumb({
        timestamp: start,
        type: 'debug',
        category: 'performance',
        message: `Starting ${name}`,
      })

      try {
        const result = fn(...args)

        if (result instanceof Promise) {
          return result.finally(() => {
            const duration = Date.now() - start
            tracker.addBreadcrumb({
              timestamp: Date.now(),
              type: 'debug',
              category: 'performance',
              message: `Completed ${name}`,
              data: { duration },
            })
          })
        } else {
          const duration = Date.now() - start
          tracker.addBreadcrumb({
            timestamp: Date.now(),
            type: 'debug',
            category: 'performance',
            message: `Completed ${name}`,
            data: { duration },
          })
          return result
        }
      } catch (error) {
        const duration = Date.now() - start
        tracker.addBreadcrumb({
          timestamp: Date.now(),
          type: 'error',
          category: 'performance',
          message: `Failed ${name}`,
          data: { duration, error: String(error) },
        })
        throw error
      }
    }) as T
  },
}

// Usage examples
export const ERROR_TRACKING_EXAMPLES = {
  basic: `
import { createErrorTrackingMiddleware, ERROR_TRACKING_CONFIGS } from './error-tracking.template'

const app = new Hono()

// Add error tracking middleware
app.use('*', createErrorTrackingMiddleware(ERROR_TRACKING_CONFIGS.production))

// Your routes...
app.get('/api/users', (c) => {
  throw new Error('Something went wrong!')
})
`,

  withSentry: `
import { createErrorTracker, createErrorTrackingMiddleware } from './error-tracking.template'

const errorTracker = createErrorTracker({
  enabled: true,
  provider: 'sentry',
  dsn: process.env.SENTRY_DSN!,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  sampleRate: 0.1,
})

const app = new Hono()
app.use('*', createErrorTrackingMiddleware({
  enabled: true,
  provider: 'sentry',
  dsn: process.env.SENTRY_DSN!,
}))

// Manual error tracking
app.post('/api/orders', async (c) => {
  try {
    const order = await createOrder()
    return c.json(order)
  } catch (error) {
    errorTracker.captureException(error, {
      tags: { operation: 'create_order' },
      extra: { userId: c.get('userId') },
    })
    throw error
  }
})
`,

  customContext: `
import { createErrorTracker, ERROR_TRACKING_HELPERS } from './error-tracking.template'

const errorTracker = createErrorTracker({
  enabled: true,
  provider: 'sentry',
  dsn: process.env.SENTRY_DSN!,
})

// Set user context
errorTracker.setUser({
  id: '123',
  email: 'user@example.com',
  username: 'john_doe',
})

// Add custom tags and context
errorTracker.setTag('feature', 'payment')
errorTracker.setExtra('paymentProvider', 'stripe')

// Wrap functions with error tracking
const processPayment = ERROR_TRACKING_HELPERS.wrapAsync(
  async (amount: number) => {
    // Payment processing logic
    throw new Error('Payment failed')
  },
  errorTracker,
  { tags: { operation: 'payment' } }
)

// Performance tracking
const fetchUserData = ERROR_TRACKING_HELPERS.withPerformanceTracking(
  'fetchUserData',
  async (userId: string) => {
    // Fetch user data
    return { id: userId, name: 'John' }
  },
  errorTracker
)
`,
}
