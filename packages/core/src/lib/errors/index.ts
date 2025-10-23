// Re-export all error classes and utilities from @g-1/util
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  getErrorCode,
  getErrorMessage,
  getErrorStatusCode,
  isOperationalError,
  NotFoundError,
  RateLimitError,
  type StatusCode,
  ValidationError,
} from '@g-1/util/web'
