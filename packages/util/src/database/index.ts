import { NotFoundError } from '../web/index.js'

/**
 * Database error for when a required record is not found
 */
export class DatabaseNotFoundError extends NotFoundError {
  constructor(table: string, identifier?: string | number) {
    const message = identifier
      ? `Record not found in ${table} with identifier: ${identifier}`
      : `Record not found in ${table}`
    super(message, table)
  }
}

/**
 * Take the first result from a query or throw an error if not found
 */
export function takeFirstOrThrow<T>(results: T[], table: string, identifier?: string | number): T {
  if (results.length === 0) {
    throw new DatabaseNotFoundError(table, identifier)
  }
  return results[0]
}

/**
 * Take the first result from a query or return undefined if not found
 */
export function takeFirst<T>(results: T[]): T | undefined {
  return results.length > 0 ? results[0] : undefined
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/**
 * Pagination result
 */
export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    offset: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Calculate pagination offset from page and limit
 */
export function calculateOffset(page: number = 1, limit: number = 10): number {
  return Math.max(0, (page - 1) * limit)
}

/**
 * Create pagination result
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 10
): PaginationResult<T> {
  const offset = calculateOffset(page, limit)
  const totalPages = Math.ceil(total / limit)

  return {
    data,
    pagination: {
      page,
      limit,
      offset,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Normalize pagination parameters
 */
export function normalizePagination(params: PaginationParams = {}): Required<PaginationParams> {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 10))
  const offset = params.offset ?? calculateOffset(page, limit)

  return { page, limit, offset }
}

/**
 * Database transaction callback type
 */
export type TransactionCallback<T> = () => Promise<T>

/**
 * Retry configuration for database operations
 */
export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 100,
  maxDelay: 5000,
  backoffFactor: 2,
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelay * config.backoffFactor ** (attempt - 1)
  return Math.min(delay, config.maxDelay)
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a database operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === config.maxAttempts) {
        break
      }

      const delay = calculateRetryDelay(attempt, config)
      await sleep(delay)
    }
  }

  throw new Error(lastError?.message || 'Operation failed after retries')
}

/**
 * Check if an error is a database constraint violation
 */
export function isConstraintViolation(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('unique constraint') ||
    message.includes('foreign key constraint') ||
    message.includes('check constraint') ||
    message.includes('not null constraint') ||
    message.includes('duplicate key') ||
    message.includes('violates')
  )
}

/**
 * Check if an error is a database connection error
 */
export function isConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('econnrefused') ||
    message.includes('enotfound')
  )
}
