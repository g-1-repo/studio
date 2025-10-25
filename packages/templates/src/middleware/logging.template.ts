import type { Context, Next } from 'hono'

/**
 * Logging middleware templates
 */

export interface LoggingConfig {
  level?: 'debug' | 'info' | 'warn' | 'error'
  format?: 'json' | 'text' | 'combined' | 'common' | 'dev'
  includeRequestBody?: boolean
  includeResponseBody?: boolean
  maxBodySize?: number
  excludePaths?: string[]
  excludeHeaders?: string[]
  includeHeaders?: string[]
  maskSensitiveData?: boolean
  sensitiveFields?: string[]
  customLogger?: Logger
  onLog?: (logData: LogData) => void | Promise<void>
  colorize?: boolean
  timestamp?: boolean
  requestId?: boolean
  performance?: boolean
}

export interface Logger {
  debug(message: string, meta?: any): void
  info(message: string, meta?: any): void
  warn(message: string, meta?: any): void
  error(message: string, meta?: any): void
}

export interface LogData {
  timestamp: string
  requestId?: string
  method: string
  url: string
  path: string
  query: Record<string, string>
  headers: Record<string, string>
  userAgent?: string
  ip: string
  statusCode: number
  responseTime: number
  requestBody?: any
  responseBody?: any
  error?: Error
  user?: any
  level: string
}

/**
 * Default console logger
 */
export class ConsoleLogger implements Logger {
  constructor(private colorize: boolean = true) {}

  debug(message: string, meta?: any): void {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta)
  }

  private log(level: string, message: string, meta?: any): void {
    const timestamp = new Date().toISOString()
    const colorMap = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m', // green
      warn: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
    }
    const reset = '\x1b[0m'

    const color = this.colorize ? colorMap[level as keyof typeof colorMap] || '' : ''
    const logMessage = `${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`

    console.log(logMessage, meta ? JSON.stringify(meta, null, 2) : '')
  }
}

/**
 * Structured JSON logger
 */
export class JSONLogger implements Logger {
  debug(message: string, meta?: any): void {
    this.log('debug', message, meta)
  }

  info(message: string, meta?: any): void {
    this.log('info', message, meta)
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta)
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta)
  }

  private log(level: string, message: string, meta?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    }
    console.log(JSON.stringify(logEntry))
  }
}

/**
 * Default logging configuration
 */
export const DEFAULT_LOGGING_CONFIG: Required<Omit<LoggingConfig, 'customLogger' | 'onLog'>> = {
  level: 'info',
  format: 'json',
  includeRequestBody: false,
  includeResponseBody: false,
  maxBodySize: 1024 * 10, // 10KB
  excludePaths: ['/health', '/metrics', '/favicon.ico'],
  excludeHeaders: ['authorization', 'cookie', 'x-api-key'],
  includeHeaders: ['content-type', 'user-agent', 'x-forwarded-for'],
  maskSensitiveData: true,
  sensitiveFields: ['password', 'token', 'secret', 'key', 'authorization'],
  colorize: process.env.NODE_ENV === 'development',
  timestamp: true,
  requestId: true,
  performance: true,
}

/**
 * Generate request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Mask sensitive data
 */
function maskSensitiveData(obj: any, sensitiveFields: string[]): any {
  if (!obj || typeof obj !== 'object') return obj

  const masked = Array.isArray(obj) ? [...obj] : { ...obj }

  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = '***MASKED***'
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key], sensitiveFields)
    }
  }

  return masked
}

/**
 * Filter headers
 */
function filterHeaders(
  headers: Record<string, string>,
  includeHeaders?: string[],
  excludeHeaders?: string[]
): Record<string, string> {
  const filtered: Record<string, string> = {}

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase()

    // If includeHeaders is specified, only include those
    if (includeHeaders && includeHeaders.length > 0) {
      if (includeHeaders.some(h => h.toLowerCase() === lowerKey)) {
        filtered[key] = value
      }
      continue
    }

    // Otherwise, exclude specified headers
    if (excludeHeaders?.some(h => h.toLowerCase() === lowerKey)) {
      continue
    }

    filtered[key] = value
  }

  return filtered
}

/**
 * Create logging middleware
 */
export function createLoggingMiddleware(config: LoggingConfig = {}) {
  const options = { ...DEFAULT_LOGGING_CONFIG, ...config }
  const logger =
    options.customLogger ||
    (options.format === 'json' ? new JSONLogger() : new ConsoleLogger(options.colorize))

  return async (c: Context, next: Next) => {
    const startTime = Date.now()
    const requestId = options.requestId ? generateRequestId() : undefined

    // Add request ID to context
    if (requestId) {
      c.set('requestId', requestId)
      c.header('X-Request-ID', requestId)
    }

    // Check if path should be excluded
    const path = c.req.path
    if (options.excludePaths.some(excludePath => path.startsWith(excludePath))) {
      return next()
    }

    // Capture request data
    const method = c.req.method
    const url = c.req.url
    const query = Object.fromEntries(new URL(url).searchParams.entries())
    const headers = filterHeaders(
      Object.fromEntries(c.req.raw.headers.entries()),
      options.includeHeaders,
      options.excludeHeaders
    )
    const userAgent = c.req.header('user-agent')
    const ip =
      c.req.header('x-forwarded-for') ||
      c.req.header('x-real-ip') ||
      c.req.header('cf-connecting-ip') ||
      'unknown'

    // Capture request body if enabled
    let requestBody: any
    if (options.includeRequestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const contentType = c.req.header('content-type') || ''
        if (contentType.includes('application/json')) {
          const text = await c.req.text()
          if (text.length <= options.maxBodySize) {
            requestBody = JSON.parse(text)
            if (options.maskSensitiveData) {
              requestBody = maskSensitiveData(requestBody, options.sensitiveFields)
            }
          }
          // Re-create request with the consumed body
          const _newRequest = new Request(c.req.url, {
            method: c.req.method,
            headers: c.req.header(),
            body: text,
          })
          // Note: Cannot reassign to c.req as it's read-only
        }
      } catch (_error) {
        // Ignore body parsing errors
      }
    }

    let error: Error | undefined
    let responseBody: any

    try {
      await next()
    } catch (err) {
      error = err as Error
      throw err
    } finally {
      const endTime = Date.now()
      const responseTime = endTime - startTime
      const statusCode = c.res.status

      // Capture response body if enabled
      if (options.includeResponseBody && !error) {
        try {
          const response = c.res.clone()
          const contentType = response.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const text = await response.text()
            if (text.length <= options.maxBodySize) {
              responseBody = JSON.parse(text)
              if (options.maskSensitiveData) {
                responseBody = maskSensitiveData(responseBody, options.sensitiveFields)
              }
            }
          }
        } catch (_error) {
          // Ignore response body parsing errors
        }
      }

      // Create log data
      const logData: LogData = {
        timestamp: new Date().toISOString(),
        requestId,
        method,
        url,
        path,
        query,
        headers,
        userAgent,
        ip,
        statusCode,
        responseTime,
        requestBody,
        responseBody,
        error,
        user: c.get('user'),
        level: error ? 'error' : statusCode >= 400 ? 'warn' : 'info',
      }

      // Call custom onLog callback
      if (options.onLog) {
        await options.onLog(logData)
      }

      // Log based on format
      switch (options.format) {
        case 'json':
          logger.info('HTTP Request', logData)
          break

        case 'combined': {
          const combinedMessage = `${ip} - - [${logData.timestamp}] "${method} ${path}" ${statusCode} ${responseTime}ms "${userAgent}"`
          logger.info(combinedMessage)
          break
        }

        case 'common': {
          const commonMessage = `${ip} - - [${logData.timestamp}] "${method} ${path}" ${statusCode}`
          logger.info(commonMessage)
          break
        }

        case 'dev': {
          const devMessage = `${method} ${path} ${statusCode} ${responseTime}ms`
          if (error) {
            logger.error(devMessage, { error: error.message })
          } else if (statusCode >= 400) {
            logger.warn(devMessage)
          } else {
            logger.info(devMessage)
          }
          break
        }

        default: {
          const textMessage = `${method} ${path} - ${statusCode} - ${responseTime}ms`
          logger.info(textMessage, { requestId, ip, userAgent })
        }
      }
    }
  }
}

/**
 * Predefined logging configurations
 */
export const LOGGING_CONFIGS = {
  /**
   * Development logging (colorized, detailed)
   */
  development: (): LoggingConfig => ({
    level: 'debug',
    format: 'dev',
    includeRequestBody: true,
    includeResponseBody: true,
    maxBodySize: 1024 * 50, // 50KB
    colorize: true,
    timestamp: true,
    requestId: true,
    performance: true,
  }),

  /**
   * Production logging (JSON, structured)
   */
  production: (): LoggingConfig => ({
    level: 'info',
    format: 'json',
    includeRequestBody: false,
    includeResponseBody: false,
    maskSensitiveData: true,
    colorize: false,
    timestamp: true,
    requestId: true,
    performance: true,
  }),

  /**
   * Debug logging (everything enabled)
   */
  debug: (): LoggingConfig => ({
    level: 'debug',
    format: 'json',
    includeRequestBody: true,
    includeResponseBody: true,
    maxBodySize: 1024 * 100, // 100KB
    excludePaths: [], // Don't exclude any paths
    maskSensitiveData: false, // Don't mask for debugging
    colorize: true,
    timestamp: true,
    requestId: true,
    performance: true,
  }),

  /**
   * Minimal logging (errors only)
   */
  minimal: (): LoggingConfig => ({
    level: 'error',
    format: 'text',
    includeRequestBody: false,
    includeResponseBody: false,
    excludePaths: ['/health', '/metrics', '/favicon.ico', '/robots.txt'],
    colorize: false,
    timestamp: true,
    requestId: false,
    performance: false,
  }),

  /**
   * Security-focused logging
   */
  security: (): LoggingConfig => ({
    level: 'info',
    format: 'json',
    includeRequestBody: true,
    includeResponseBody: false,
    maxBodySize: 1024 * 10, // 10KB
    maskSensitiveData: true,
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'ssn',
      'credit_card',
      'cvv',
      'pin',
    ],
    includeHeaders: [
      'user-agent',
      'x-forwarded-for',
      'x-real-ip',
      'cf-connecting-ip',
      'x-forwarded-proto',
    ],
    timestamp: true,
    requestId: true,
    performance: true,
  }),
}

/**
 * Create structured logger with custom transports
 */
export function createStructuredLogger(transports: LogTransport[] = []) {
  return {
    debug: (message: string, meta?: any) => log('debug', message, meta, transports),
    info: (message: string, meta?: any) => log('info', message, meta, transports),
    warn: (message: string, meta?: any) => log('warn', message, meta, transports),
    error: (message: string, meta?: any) => log('error', message, meta, transports),
  }
}

export interface LogTransport {
  name: string
  level: string
  write: (logData: LogData) => void | Promise<void>
}

function log(level: string, _message: string, meta: any, transports: LogTransport[]) {
  const logData: LogData = {
    timestamp: new Date().toISOString(),
    level,
    method: '',
    url: '',
    path: '',
    query: {},
    headers: {},
    ip: '',
    statusCode: 0,
    responseTime: 0,
    ...meta,
  }

  transports.forEach(transport => {
    if (shouldLog(level, transport.level)) {
      transport.write(logData)
    }
  })
}

function shouldLog(messageLevel: string, transportLevel: string): boolean {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 }
  return (
    levels[messageLevel as keyof typeof levels] >= levels[transportLevel as keyof typeof levels]
  )
}

/**
 * Built-in transports
 */
export const LOG_TRANSPORTS = {
  console: (level: string = 'info'): LogTransport => ({
    name: 'console',
    level,
    write: (logData: LogData) => {
      console.log(JSON.stringify(logData))
    },
  }),

  file: (filename: string, level: string = 'info'): LogTransport => ({
    name: 'file',
    level,
    write: (logData: LogData) => {
      const fs = require('node:fs')
      const logLine = `${JSON.stringify(logData)}\n`
      fs.appendFileSync(filename, logLine)
    },
  }),

  http: (url: string, level: string = 'info'): LogTransport => ({
    name: 'http',
    level,
    write: async (logData: LogData) => {
      try {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
        })
      } catch (error) {
        console.error('Failed to send log to HTTP transport:', error)
      }
    },
  }),
}

/**
 * Usage examples
 */
export const LOGGING_EXAMPLES = {
  basic: `// Basic logging setup
import { createLoggingMiddleware } from './logging.template'

const app = new Hono()

// Add logging to all routes
app.use('*', createLoggingMiddleware({
  format: 'json',
  level: 'info'
}))`,

  environment: `// Environment-based logging
import { createLoggingMiddleware, LOGGING_CONFIGS } from './logging.template'

const app = new Hono()

const loggingConfig = process.env.NODE_ENV === 'production' 
  ? LOGGING_CONFIGS.production()
  : LOGGING_CONFIGS.development()

app.use('*', createLoggingMiddleware(loggingConfig))`,

  custom: `// Custom logger with multiple transports
import { createLoggingMiddleware, createStructuredLogger, LOG_TRANSPORTS } from './logging.template'

const logger = createStructuredLogger([
  LOG_TRANSPORTS.console('info'),
  LOG_TRANSPORTS.file('./logs/app.log', 'warn'),
  LOG_TRANSPORTS.http('https://logs.example.com/api/logs', 'error')
])

const app = new Hono()

app.use('*', createLoggingMiddleware({
  customLogger: logger,
  onLog: async (logData) => {
    // Custom log processing
    if (logData.statusCode >= 500) {
      // Send alert for server errors
      await sendAlert(logData)
    }
  }
}))`,

  security: `// Security-focused logging
import { createLoggingMiddleware, LOGGING_CONFIGS } from './logging.template'

const app = new Hono()

app.use('*', createLoggingMiddleware({
  ...LOGGING_CONFIGS.security(),
  onLog: async (logData) => {
    // Log security events
    if (logData.statusCode === 401 || logData.statusCode === 403) {
      await logSecurityEvent(logData)
    }
  }
}))`,
}

export default {
  createLoggingMiddleware,
  createStructuredLogger,
  ConsoleLogger,
  JSONLogger,
  LOGGING_CONFIGS,
  LOG_TRANSPORTS,
  DEFAULT_LOGGING_CONFIG,
}
