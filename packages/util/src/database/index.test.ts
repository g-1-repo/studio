import { describe, it, expect, vi } from 'vitest'
import {
  DatabaseNotFoundError,
  takeFirstOrThrow,
  takeFirst,
  calculateOffset,
  createPaginationResult,
  normalizePagination,
  calculateRetryDelay,
  sleep,
  retryOperation,
  isConstraintViolation,
  isConnectionError,
  DEFAULT_RETRY_CONFIG,
  type PaginationParams,
  type RetryConfig
} from './index'

describe('database utilities', () => {
  describe('DatabaseNotFoundError', () => {
    it('should create error with table name only', () => {
      const error = new DatabaseNotFoundError('users')
      expect(error.message).toBe('Record not found in users')
      expect(error.name).toBe('DatabaseNotFoundError')
    })

    it('should create error with table name and identifier', () => {
      const error = new DatabaseNotFoundError('users', 123)
      expect(error.message).toBe('Record not found in users with identifier: 123')
    })

    it('should create error with string identifier', () => {
      const error = new DatabaseNotFoundError('users', 'john@example.com')
      expect(error.message).toBe('Record not found in users with identifier: john@example.com')
    })
  })

  describe('takeFirstOrThrow', () => {
    it('should return first result when array has items', () => {
      const results = [{ id: 1 }, { id: 2 }]
      const result = takeFirstOrThrow(results, 'users')
      expect(result).toEqual({ id: 1 })
    })

    it('should throw DatabaseNotFoundError when array is empty', () => {
      const results: any[] = []
      expect(() => takeFirstOrThrow(results, 'users')).toThrow(DatabaseNotFoundError)
    })

    it('should throw with identifier when provided', () => {
      const results: any[] = []
      expect(() => takeFirstOrThrow(results, 'users', 123)).toThrow(
        'Record not found in users with identifier: 123'
      )
    })
  })

  describe('takeFirst', () => {
    it('should return first result when array has items', () => {
      const results = [{ id: 1 }, { id: 2 }]
      const result = takeFirst(results)
      expect(result).toEqual({ id: 1 })
    })

    it('should return undefined when array is empty', () => {
      const results: any[] = []
      const result = takeFirst(results)
      expect(result).toBeUndefined()
    })
  })

  describe('calculateOffset', () => {
    it('should calculate offset with default values', () => {
      const offset = calculateOffset()
      expect(offset).toBe(0) // (1 - 1) * 10
    })

    it('should calculate offset for page 2', () => {
      const offset = calculateOffset(2, 10)
      expect(offset).toBe(10) // (2 - 1) * 10
    })

    it('should calculate offset with custom limit', () => {
      const offset = calculateOffset(3, 5)
      expect(offset).toBe(10) // (3 - 1) * 5
    })
  })

  describe('createPaginationResult', () => {
    it('should create pagination result with default values', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const result = createPaginationResult(data, 25)
      
      expect(result.data).toEqual(data)
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        offset: 0,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false
      })
    })

    it('should create pagination result for middle page', () => {
      const data = [{ id: 11 }, { id: 12 }]
      const result = createPaginationResult(data, 25, 2, 10)
      
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        offset: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: true
      })
    })

    it('should create pagination result for last page', () => {
      const data = [{ id: 21 }]
      const result = createPaginationResult(data, 25, 3, 10)
      
      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        offset: 20,
        total: 25,
        totalPages: 3,
        hasNext: false,
        hasPrev: true
      })
    })
  })

  describe('normalizePagination', () => {
    it('should return defaults when no params provided', () => {
      const result = normalizePagination()
      expect(result).toEqual({
        page: 1,
        limit: 10,
        offset: 0
      })
    })

    it('should normalize partial params', () => {
      const result = normalizePagination({ page: 2 })
      expect(result).toEqual({
        page: 2,
        limit: 10,
        offset: 10
      })
    })

    it('should use provided offset over calculated', () => {
      const result = normalizePagination({ page: 2, limit: 5, offset: 15 })
      expect(result).toEqual({
        page: 2,
        limit: 5,
        offset: 15
      })
    })
  })

  describe('calculateRetryDelay', () => {
    it('should calculate delay with default config', () => {
      const delay = calculateRetryDelay(1)
      expect(delay).toBe(100) // baseDelay * backoffFactor^(attempt-1)
    })

    it('should calculate exponential backoff', () => {
      const delay1 = calculateRetryDelay(1, DEFAULT_RETRY_CONFIG)
      const delay2 = calculateRetryDelay(2, DEFAULT_RETRY_CONFIG)
      const delay3 = calculateRetryDelay(3, DEFAULT_RETRY_CONFIG)
      
      expect(delay1).toBe(100)
      expect(delay2).toBe(200)
      expect(delay3).toBe(400)
    })

    it('should cap at maxDelay', () => {
      const config: RetryConfig = {
        maxAttempts: 10,
        baseDelay: 1000,
        maxDelay: 2000,
        backoffFactor: 3
      }
      
      const delay = calculateRetryDelay(5, config)
      expect(delay).toBe(2000) // Should be capped at maxDelay
    })
  })

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now()
      await sleep(50)
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(45) // Allow some tolerance
    })
  })

  describe('retryOperation', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')
      
      const result = await retryOperation(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success')
      
      const result = await retryOperation(operation)
      
      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should fail after max attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('persistent failure'))
      
      await expect(retryOperation(operation, { ...DEFAULT_RETRY_CONFIG, maxAttempts: 2 }))
        .rejects.toThrow('persistent failure')
      
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should use custom retry config', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('failure'))
      const config: RetryConfig = {
        maxAttempts: 1,
        baseDelay: 10,
        maxDelay: 100,
        backoffFactor: 1
      }
      
      await expect(retryOperation(operation, config)).rejects.toThrow('failure')
      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('isConstraintViolation', () => {
    it('should return true for constraint violation errors', () => {
      const uniqueError = new Error('unique constraint failed')
      const foreignKeyError = new Error('foreign key constraint violation')
      const checkError = new Error('check constraint failed')
      const notNullError = new Error('not null constraint violation')
      const duplicateError = new Error('duplicate key value violates unique constraint')

      expect(isConstraintViolation(uniqueError)).toBe(true)
      expect(isConstraintViolation(foreignKeyError)).toBe(true)
      expect(isConstraintViolation(checkError)).toBe(true)
      expect(isConstraintViolation(notNullError)).toBe(true)
      expect(isConstraintViolation(duplicateError)).toBe(true)
    })

    it('should return false for non-constraint errors', () => {
      const regularError = new Error('Something went wrong')
      const notAnError = { message: 'not an error' }

      expect(isConstraintViolation(regularError)).toBe(false)
      expect(isConstraintViolation(notAnError)).toBe(false)
    })
  })

  describe('isConnectionError', () => {
    it('should return true for connection errors', () => {
      const connectionError = new Error('connection refused')
      const timeoutError = new Error('connection timeout')
      const networkError = new Error('network error')
      const econnrefusedError = new Error('ECONNREFUSED')
      const enotfoundError = new Error('ENOTFOUND')

      expect(isConnectionError(connectionError)).toBe(true)
      expect(isConnectionError(timeoutError)).toBe(true)
      expect(isConnectionError(networkError)).toBe(true)
      expect(isConnectionError(econnrefusedError)).toBe(true)
      expect(isConnectionError(enotfoundError)).toBe(true)
    })

    it('should return false for non-connection errors', () => {
      const regularError = new Error('Something went wrong')
      const notAnError = { message: 'not an error' }

      expect(isConnectionError(regularError)).toBe(false)
      expect(isConnectionError(notAnError)).toBe(false)
    })
  })
})