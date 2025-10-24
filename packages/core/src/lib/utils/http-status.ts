/**
 * HTTP status utilities
 */

import {
  getStatusPhrase,
  HTTP_STATUS,
  HTTP_STATUS_PHRASES,
  isClientError,
  isErrorStatus,
  isServerError,
  isSuccessStatus,
} from '@g-1/util'

// Re-export all HTTP utilities
export {
  getStatusPhrase,
  HTTP_STATUS,
  HTTP_STATUS_PHRASES,
  isClientError,
  isErrorStatus,
  isServerError,
  isSuccessStatus,
}

// Re-export individual status codes for convenience
export const {
  OK,
  CREATED,
  NO_CONTENT,
  BAD_REQUEST,
  UNAUTHORIZED,
  FORBIDDEN,
  NOT_FOUND,
  CONFLICT,
  UNPROCESSABLE_ENTITY,
  TOO_MANY_REQUESTS,
  INTERNAL_SERVER_ERROR,
} = HTTP_STATUS

// Legacy aliases
export const SUCCESS = OK
export const ERROR = INTERNAL_SERVER_ERROR

// Helper functions
export function isSuccess(statusCode: number): boolean {
  return isSuccessStatus(statusCode)
}
