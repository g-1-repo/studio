import {
  DatabaseQueryError as DatabaseError,
  QueryNotFoundError as NotFoundError,
  takeFirst as takeFirstGeneric,
  takeFirstOrThrow as takeFirstOrThrowGeneric,
} from '@g-1/util/database'
import { text } from 'drizzle-orm/sqlite-core'
import { InternalError, NotFound } from './exceptions'

/* -------------------------------------------------------------------------- */
/*                                 Repository                                 */
/* -------------------------------------------------------------------------- */

// Re-export takeFirst directly (no error handling needed)
export const takeFirst = takeFirstGeneric

// Wrapper that converts @g-1/util errors to HTTPException
export function takeFirstOrThrow<T>(values: T[], message?: string): T {
  try {
    return takeFirstOrThrowGeneric(values, message)
  }
  catch (error) {
    if (error instanceof NotFoundError) {
      throw NotFound(error.message)
    }
    if (error instanceof DatabaseError) {
      // eslint-disable-next-line unicorn/throw-new-error
      throw InternalError(error.message)
    }
    throw error
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
