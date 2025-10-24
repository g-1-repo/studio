/**
 * Base error class for all application errors
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly timestamp: string

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): { error: { name: string, message: string, statusCode: number, timestamp: string, isOperational: boolean } } {
    return {
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
        isOperational: this.isOperational,
      },
    }
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AppError {
  public readonly field?: string
  public readonly value?: unknown

  constructor(message: string, field?: string, value?: unknown) {
    super(message, 400)
    this.field = field
    this.value = value
  }
}

/**
 * Authentication error for unauthorized access
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

/**
 * Authorization error for forbidden access
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  public readonly resource?: string

  constructor(message: string = 'Resource not found', resource?: string) {
    super(message, 404)
    this.resource = resource
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409)
  }
}

/**
 * Rate limit error for too many requests
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429)
    this.retryAfter = retryAfter
  }
}

/**
 * Internal server error for unexpected errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false)
  }
}

/**
 * Service unavailable error for maintenance or overload
 */
export class ServiceUnavailableError extends AppError {
  public readonly retryAfter?: number

  constructor(message: string = 'Service unavailable', retryAfter?: number) {
    super(message, 503)
    this.retryAfter = retryAfter
  }
}

/**
 * Check if an error is an operational error (safe to expose to clients)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

/**
 * Get error code from an error
 */
export function getErrorCode(error: Error): string {
  if (error instanceof AppError) {
    return error.name
  }
  return 'INTERNAL_ERROR'
}

/**
 * Get error message from an error
 */
export function getErrorMessage(error: Error): string {
  return error.message || 'An unexpected error occurred'
}

/**
 * Get error status code from an error
 */
export function getErrorStatusCode(error: Error): number {
  if (error instanceof AppError) {
    return error.statusCode
  }
  return 500
}

/**
 * Status code type
 */
export type StatusCode = number
