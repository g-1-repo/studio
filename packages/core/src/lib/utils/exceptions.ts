/**
 * Exception utilities and error classes
 */

import { HTTPException } from 'hono/http-exception'
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  isOperationalError,
  getErrorCode,
  getErrorMessage,
  getErrorStatusCode,
} from '@g-1/util'

// Re-export all error classes and utilities
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  isOperationalError,
  getErrorCode,
  getErrorMessage,
  getErrorStatusCode,
}

// Create convenience functions for common errors
export function createBadRequest(message = 'Bad Request') {
  return new ValidationError(message)
}

export function createUnauthorized(message = 'Unauthorized') {
  return new AuthenticationError(message)
}

export function createForbidden(message = 'Forbidden') {
  return new AuthorizationError(message)
}

export function createNotFound(message = 'Not Found', resource?: string) {
  return new NotFoundError(message, resource)
}

export function createConflict(message = 'Conflict') {
  return new ConflictError(message)
}

export function createTooManyRequests(message = 'Too Many Requests', retryAfter?: number) {
  return new RateLimitError(message, retryAfter)
}

export function createInternalError(message = 'Internal Server Error') {
  return new InternalServerError(message)
}

export function createServiceUnavailable(message = 'Service Unavailable', retryAfter?: number) {
  return new ServiceUnavailableError(message, retryAfter)
}

// Legacy error aliases for backward compatibility
export const BadRequestError = ValidationError
export const UnauthorizedError = AuthenticationError
export const ForbiddenError = AuthorizationError
export const TimeoutError = InternalServerError
export const NetworkError = InternalServerError
export const DatabaseError = InternalServerError
export const ExternalServiceError = ServiceUnavailableError

// Wrapper functions that create Hono HTTPException objects
export function TooManyRequests(message: string = 'Too many requests') {
  const error = createTooManyRequests(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function Forbidden(message: string = 'Forbidden') {
  const error = createForbidden(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function Unauthorized(message: string = 'Unauthorized') {
  const error = createUnauthorized(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function NotFound(message: string = 'Not Found') {
  const error = createNotFound(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function BadRequest(message: string = 'Bad Request') {
  const error = createBadRequest(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function InternalError(message: string = 'Internal Error') {
  const error = createInternalError(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function Conflict(message: string = 'Already exists') {
  const error = createConflict(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}
