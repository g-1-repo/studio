// Re-export all error classes and utilities from @g-1/util
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
  getErrorCode,
  getErrorMessage,
  getErrorStatusCode,
  isOperationalError,
  type StatusCode,
} from '@g-1/util'

// Legacy aliases for backward compatibility
export { ValidationError as BadRequestError } from '@g-1/util'
export { InternalServerError as TimeoutError } from '@g-1/util'
export { InternalServerError as NetworkError } from '@g-1/util'
export { InternalServerError as DatabaseError } from '@g-1/util'
export { InternalServerError as ExternalServiceError } from '@g-1/util'
