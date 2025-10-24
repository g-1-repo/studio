// Re-export all error classes and utilities from @g-1/util
// Legacy aliases for backward compatibility
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  getErrorCode,
  getErrorMessage,
  getErrorStatusCode,
  InternalServerError,
  InternalServerError as TimeoutError,
  InternalServerError as NetworkError,
  InternalServerError as DatabaseError,
  InternalServerError as ExternalServiceError,
  isOperationalError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  type StatusCode,
  ValidationError,
  ValidationError as BadRequestError,
} from '@g-1/util'
