import {
  NotFoundError,
  DatabaseNotFoundError,
  takeFirstOrThrow,
  takeFirst,
  PaginationParams,
  PaginationResult,
  calculateOffset,
  createPaginationResult,
  normalizePagination,
  TransactionCallback,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  calculateRetryDelay,
  sleep,
  retryOperation,
  isConstraintViolation,
  isConnectionError,
} from '@g-1/util'

import { text } from 'drizzle-orm/sqlite-core'
import { NotFound, InternalError } from '../utils/exceptions'

// Re-export database utilities
export {
  NotFoundError,
  DatabaseNotFoundError,
  takeFirstOrThrow,
  takeFirst,
  PaginationParams,
  PaginationResult,
  calculateOffset,
  createPaginationResult,
  normalizePagination,
  TransactionCallback,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  calculateRetryDelay,
  sleep,
  retryOperation,
  isConstraintViolation,
  isConnectionError,
}

// Legacy alias
export const QueryNotFoundError = DatabaseNotFoundError

/* -------------------------------------------------------------------------- */
/*                                 Repository                                 */
/* -------------------------------------------------------------------------- */

/**
 * Take the first result from a query or throw a generic error
 */
export function takeFirstOrThrowGeneric<T>(values: T[], message?: string): T {
  if (values.length === 0) {
    throw new NotFoundError(message || 'Record not found')
  }
  return values[0]
}

/**
 * Take the first result from a query or throw an HTTP error
 */
export function takeFirstOrThrowHttp<T>(values: T[], message?: string): T {
  try {
    return takeFirstOrThrowGeneric(values, message)
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw NotFound(error.message)
    } else {
      throw InternalError((error as Error).message)
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Tables                                   */
/* -------------------------------------------------------------------------- */

// timestamps for created_at and updated_at
// Using ISO strings for better performance and consistency
const getCurrentISOString = () => new Date().toISOString()

export const timestamps = {
  createdAt: text('created_at')
    .$defaultFn(getCurrentISOString),
  updatedAt: text('updated_at')
    .$defaultFn(getCurrentISOString)
    .$onUpdate(getCurrentISOString),
  deletedAt: text('deleted_at'),
}
