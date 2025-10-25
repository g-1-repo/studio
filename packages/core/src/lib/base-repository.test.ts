import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDb } from '../db/index.js'
import type { Environment } from '../env.js'
import { BaseRepository, clearRepositoryCaches } from './base-repository'
import { DatabaseError } from './errors/index.js'

// Mock the createDb function
vi.mock('../db', () => ({
  createDb: vi.fn(),
}))

// Mock database instance
const mockDb = {
  prepare: vi.fn(),
  exec: vi.fn(),
  batch: vi.fn(),
  close: vi.fn(),
  run: vi.fn(),
}

// Test implementation of BaseRepository
class TestRepository extends BaseRepository {
  async testExecuteQuery<T>(
    env: Environment,
    operation: (db: ReturnType<typeof createDb>) => Promise<T>,
    operationName?: string
  ) {
    return this.executeQuery(env, operation, operationName)
  }

  async testExecuteBatch<T>(
    env: Environment,
    operations: Array<(db: ReturnType<typeof createDb>) => Promise<T>>,
    operationName?: string
  ) {
    return this.executeBatch(env, operations, operationName)
  }

  async testExecuteQueryWithRetry<T>(
    env: Environment,
    operation: (db: ReturnType<typeof createDb>) => Promise<T>,
    operationName?: string,
    maxRetries?: number
  ) {
    return this.executeQueryWithRetry(env, operation, operationName, maxRetries)
  }

  async testCheckDatabaseHealth(env: Environment) {
    return this.checkDatabaseHealth(env)
  }

  async testExecuteQueryWithHealthCheck<T>(
    env: Environment,
    operation: (db: ReturnType<typeof createDb>) => Promise<T>,
    operationName?: string
  ) {
    return this.executeQueryWithHealthCheck(env, operation, operationName)
  }

  testGetDbCacheStats() {
    return this.getDbCacheStats()
  }
}

describe('baseRepository', () => {
  let repository: TestRepository
  let mockEnv: Environment
  let consoleSpy: any

  beforeEach(() => {
    repository = new TestRepository()
    mockEnv = {
      CLOUDFLARE_ACCOUNT_ID: 'test-account',
      CLOUDFLARE_DATABASE_ID: 'test-db',
      NODE_ENV: 'test',
    } as Environment

    consoleSpy = {
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    }

    // Reset mocks
    vi.clearAllMocks()
    ;(createDb as any).mockReturnValue(mockDb)

    // Clear caches
    BaseRepository.clearDbCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    BaseRepository.clearDbCache()
  })

  describe('database Connection Management', () => {
    it('should cache database connections', async () => {
      const operation = vi.fn().mockResolvedValue('result')

      await repository.testExecuteQuery(mockEnv, operation)
      await repository.testExecuteQuery(mockEnv, operation)

      // createDb should only be called once due to caching
      expect(createDb).toHaveBeenCalledTimes(1)
      expect(operation).toHaveBeenCalledTimes(2)
    })

    it('should create separate cache entries for different environments', async () => {
      const operation = vi.fn().mockResolvedValue('result')
      const env2 = { ...mockEnv, CLOUDFLARE_ACCOUNT_ID: 'different-account' }

      await repository.testExecuteQuery(mockEnv, operation)
      await repository.testExecuteQuery(env2, operation)

      // createDb should be called twice for different environments
      expect(createDb).toHaveBeenCalledTimes(2)
    })

    it('should clear database cache', () => {
      const operation = vi.fn().mockResolvedValue('result')

      // First call creates cache entry
      repository.testExecuteQuery(mockEnv, operation)

      // Clear cache
      BaseRepository.clearDbCache()

      // Second call should create new connection
      repository.testExecuteQuery(mockEnv, operation)

      expect(createDb).toHaveBeenCalledTimes(2)
    })
  })

  describe('executeQuery', () => {
    it('should execute operation successfully', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const result = await repository.testExecuteQuery(mockEnv, operation, 'test-operation')

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledWith(mockDb)
    })

    it('should handle database errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Database error'))

      await expect(
        repository.testExecuteQuery(mockEnv, operation, 'test-operation')
      ).rejects.toThrow('Database error')
    })

    it('should log slow queries', async () => {
      // Set NODE_ENV to development to ensure warning is logged
      mockEnv.NODE_ENV = 'development'

      const slowOperation = vi
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('result'), 150)))

      await repository.testExecuteQuery(mockEnv, slowOperation, 'slow-operation')

      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('Slow query detected'))
    })
  })

  describe('executeBatch', () => {
    it('should execute multiple operations successfully', async () => {
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockResolvedValue('result2'),
        vi.fn().mockResolvedValue('result3'),
      ]

      const results = await repository.testExecuteBatch(mockEnv, operations, 'batch-operation')

      expect(results).toEqual(['result1', 'result2', 'result3'])
      operations.forEach(op => expect(op).toHaveBeenCalledWith(mockDb))
    })

    it('should handle batch operation errors', async () => {
      const operations = [
        vi.fn().mockResolvedValue('result1'),
        vi.fn().mockRejectedValue(new Error('Batch error')),
        vi.fn().mockResolvedValue('result3'),
      ]

      await expect(
        repository.testExecuteBatch(mockEnv, operations, 'batch-operation')
      ).rejects.toThrow('Batch error')
    })

    it('should log batch performance metrics', async () => {
      const operations = [
        vi.fn().mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 250)) // Simulate slow operation
          return 'result1'
        }),
        vi.fn().mockResolvedValue('result2'),
      ]

      await repository.testExecuteBatch(mockEnv, operations, 'batch-operation')

      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Batch operation: batch-operation took')
      )
    })
  })

  describe('executeQueryWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success')

      const result = await repository.testExecuteQueryWithRetry(
        mockEnv,
        operation,
        'retry-operation'
      )

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should retry on transient errors', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success')

      const result = await repository.testExecuteQueryWithRetry(
        mockEnv,
        operation,
        'retry-operation'
      )

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalledTimes(3)
    })

    it('should not retry on non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Unique constraint violation'))

      await expect(
        repository.testExecuteQueryWithRetry(mockEnv, operation, 'retry-operation')
      ).rejects.toThrow('Unique constraint violation')

      expect(operation).toHaveBeenCalledTimes(1)
    })

    it('should respect max retry limit', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Connection timeout'))

      await expect(
        repository.testExecuteQueryWithRetry(mockEnv, operation, 'retry-operation', 2)
      ).rejects.toThrow('Connection timeout')

      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('database Health Checks', () => {
    it('should return true for healthy database', async () => {
      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockResolvedValue({ result: 1 }),
      })

      const isHealthy = await repository.testCheckDatabaseHealth(mockEnv)

      expect(isHealthy).toBe(true)
    })

    it('should return false for unhealthy database', async () => {
      mockDb.run.mockRejectedValue(new Error('Database error'))

      const isHealthy = await repository.testCheckDatabaseHealth(mockEnv)

      expect(isHealthy).toBe(false)
    })

    it('should cache health check results', async () => {
      mockDb.run.mockResolvedValue({ success: true })

      await repository.testCheckDatabaseHealth(mockEnv)
      await repository.testCheckDatabaseHealth(mockEnv)

      // Should only call run once due to caching
      expect(mockDb.run).toHaveBeenCalledTimes(1)
    })

    it('should get database health status', async () => {
      mockDb.run.mockResolvedValue({ success: true })

      const status = await repository.getDatabaseHealthStatus(mockEnv)

      expect(status.status).toBe('healthy')
      expect(status.timestamp).toBeDefined()
      expect(status.responseTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('executeQueryWithHealthCheck', () => {
    it('should execute operation when database is healthy', async () => {
      mockDb.run.mockResolvedValue({ success: true })
      const operation = vi.fn().mockResolvedValue('success')

      const result = await repository.testExecuteQueryWithHealthCheck(
        mockEnv,
        operation,
        'health-check-operation'
      )

      expect(result).toBe('success')
      expect(operation).toHaveBeenCalled()
    })

    it('should throw error when database is unhealthy', async () => {
      mockDb.run.mockRejectedValue(new Error('Database error'))
      const operation = vi.fn().mockResolvedValue('success')

      await expect(
        repository.testExecuteQueryWithHealthCheck(mockEnv, operation, 'health-check-operation')
      ).rejects.toThrow(DatabaseError)

      expect(operation).not.toHaveBeenCalled()
    })
  })

  describe('cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = repository.testGetDbCacheStats()

      expect(stats).toHaveProperty('dbCache')
      expect(stats.dbCache).toHaveProperty('size')
      expect(stats.dbCache).toHaveProperty('keys')
      expect(typeof stats.dbCache.size).toBe('number')
      expect(Array.isArray(stats.dbCache.keys)).toBe(true)
    })

    it('should clear repository caches', () => {
      // Create some cache entries
      repository.testExecuteQuery(mockEnv, vi.fn().mockResolvedValue('result'))

      clearRepositoryCaches()

      const stats = repository.testGetDbCacheStats()
      expect(stats.dbCache.size).toBe(0)
    })
  })
})
