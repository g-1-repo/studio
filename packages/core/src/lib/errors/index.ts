// Re-export all error classes and utilities from @g-1/util
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  getErrorCode,
  getErrorMessage,
  getErrorStatusCode,
  InternalServerError,
  isOperationalError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  type StatusCode,
  ValidationError,
} from '@g-1/util'

// Legacy aliases for backward compatibility
export { ValidationError as BadRequestError } from '@g-1/util'
export { InternalServerError as TimeoutError } from '@g-1/util'
export { InternalServerError as NetworkError } from '@g-1/util'
export { InternalServerError as DatabaseError } from '@g-1/util'
export { InternalServerError as ExternalServiceError } from '@g-1/util'
