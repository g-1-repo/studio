import type { Environment } from '@/env'

import { createDb } from '@/db'
import { DatabaseError } from '@/lib/errors'

// Simple cache management utilities
function clearCache() {
  // Global cache clearing - placeholder for future implementation
  // Could be used to clear any global application caches
}

function getCacheStats() {
  // Global cache stats - placeholder for future implementation
  return {
    size: 0,
    hits: 0,
    misses: 0,
  }
}

/**
 * Base repository class with connection management and common patterns
 *
 * Features:
 * - Connection pooling and caching for better performance
 * - Query performance monitoring with slow query detection
 * - Standardized error handling and logging
 * - Memory management utilities
 */
export abstract class BaseRepository {
  protected static dbCache: Map<string, ReturnType<typeof createDb>> = new Map()
  private static healthCheckCache: Map<string, { status: boolean, timestamp: number }> = new Map()
  private static readonly HEALTH_CHECK_TTL = 30 * 1000 // 30 seconds

  /**
   * Get database connection with caching for performance
   * Uses environment-specific cache keys to handle multiple databases
   */
  protected getDb(env: Environment) {
    // Create a cache key based on environment
    const cacheKey = `${env.CLOUDFLARE_ACCOUNT_ID || 'default'}-${env.CLOUDFLARE_DATABASE_ID || 'default'}`

    if (!BaseRepository.dbCache.has(cacheKey)) {
      BaseRepository.dbCache.set(cacheKey, createDb(env))
    }

    return BaseRepository.dbCache.get(cacheKey)!
  }

  /**
   * Execute query with error handling and performance monitoring
   *
   * @param env - Environment configuration
   * @param operation - Database operation to execute
   * @param operationName - Name for logging and monitoring
   * @returns Promise with operation result
   */
  protected async executeQuery<T>(
    env: Environment,
    operation: (db: ReturnType<typeof createDb>) => Promise<T>,
    operationName?: string,
  ): Promise<T> {
    const startTime = Date.now()
    const { db } = this.getDb(env)

    try {
      const result = await operation({ db })

      // Log slow queries in development and warn in production
      const duration = Date.now() - startTime
      if (duration > 100 && operationName) {
        const logMessage = `Slow query detected: ${operationName} took ${duration}ms`
        if (env.NODE_ENV === 'development') {
          console.warn(logMessage)
        }
        else {
          // In production, only log very slow queries to avoid spam
          if (duration > 500) {
            console.warn(logMessage)
          }
        }
      }

      return result
    }
    catch (error) {
      console.error(`Database operation failed: ${operationName || 'unknown'}`, {
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
        operation: operationName,
      })
      throw error
    }
  }

  /**
   * Execute batch operations with transaction support
   *
   * @param env - Environment configuration
   * @param operations - Array of database operations
   * @param operationName - Name for logging
   * @returns Promise with all operation results
   */
  protected async executeBatch<T>(
    env: Environment,
    operations: Array<(db: ReturnType<typeof createDb>) => Promise<T>>,
    operationName?: string,
  ): Promise<T[]> {
    const startTime = Date.now()
    const { db } = this.getDb(env)

    try {
      // Execute all operations in parallel for better performance
      const results = await Promise.all(
        operations.map(operation => operation({ db })),
      )

      const duration = Date.now() - startTime
      if (duration > 200 && operationName) {
        console.warn(`Batch operation: ${operationName} took ${duration}ms for ${operations.length} operations`)
      }

      return results
    }
    catch (error) {
      console.error(`Batch operation failed: ${operationName || 'unknown'}`, {
        error: error instanceof Error ? error.message : String(error),
        operationCount: operations.length,
        duration: Date.now() - startTime,
      })
      throw error
    }
  }

  /**
   * Execute query with retry logic for transient failures
   *
   * @param env - Environment configuration
   * @param operation - Database operation to execute
   * @param operationName - Name for logging
   * @param maxRetries - Maximum number of retries (default: 3)
   * @returns Promise with operation result
   */
  protected async executeQueryWithRetry<T>(
    env: Environment,
    operation: (db: ReturnType<typeof createDb>) => Promise<T>,
    operationName?: string,
    maxRetries = 3,
  ): Promise<T> {
    let lastError: Error | unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeQuery(env, operation, operationName ? `${operationName} (attempt ${attempt})` : undefined)
      }
      catch (error) {
        lastError = error

        // Don't retry for certain error types (validation, not found, etc.)
        if (error instanceof Error && this.shouldNotRetry(error)) {
          throw error
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * 2 ** (attempt - 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    console.error(`Operation failed after ${maxRetries} attempts: ${operationName}`, lastError)
    throw lastError
  }

  /**
   * Determine if an error should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    const message = error.message.toLowerCase()
    return (
      message.includes('unique constraint')
      || message.includes('foreign key constraint')
      || message.includes('not found')
      || message.includes('validation')
    )
  }

  /**
   * Check database connection health
   * Cached for 30 seconds to avoid excessive health checks
   */
  protected async checkDatabaseHealth(env: Environment): Promise<boolean> {
    const cacheKey = `${env.CLOUDFLARE_ACCOUNT_ID || 'default'}-${env.CLOUDFLARE_DATABASE_ID || 'default'}`
    const cached = BaseRepository.healthCheckCache.get(cacheKey)

    // Return cached result if still valid
    if (cached && Date.now() - cached.timestamp < BaseRepository.HEALTH_CHECK_TTL) {
      return cached.status
    }

    try {
      const { db } = this.getDb(env)
      // Simple query to test connection
      await db.run('SELECT 1')

      const healthStatus = { status: true, timestamp: Date.now() }
      BaseRepository.healthCheckCache.set(cacheKey, healthStatus)
      return true
    }
    catch (error) {
      console.error('Database health check failed:', error)
      const healthStatus = { status: false, timestamp: Date.now() }
      BaseRepository.healthCheckCache.set(cacheKey, healthStatus)
      return false
    }
  }

  /**
   * Execute query with health check validation
   */
  protected async executeQueryWithHealthCheck<T>(
    env: Environment,
    operation: (db: ReturnType<typeof createDb>) => Promise<T>,
    operationName?: string,
  ): Promise<T> {
    // Check database health before executing query
    const isHealthy = await this.checkDatabaseHealth(env)
    if (!isHealthy) {
      throw new DatabaseError(
        `Database health check failed for operation: ${operationName || 'unknown'}`,
        undefined,
        { operation: operationName },
      )
    }

    return this.executeQuery(env, operation, operationName)
  }

  /**
   * Get database health status for monitoring endpoints
   */
  async getDatabaseHealthStatus(env: Environment): Promise<{
    status: 'healthy' | 'unhealthy'
    timestamp: string
    responseTime?: number
  }> {
    const startTime = Date.now()
    const isHealthy = await this.checkDatabaseHealth(env)
    const responseTime = Date.now() - startTime

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
    }
  }

  /**
   * Clear connection cache (useful for testing or memory management)
   * Uses standardized cache clearing from @g-1/util
   */
  static clearDbCache() {
    BaseRepository.dbCache.clear()
    BaseRepository.healthCheckCache.clear()
    // Also clear any global caches from @g-1/util
    clearCache()
  }

  /**
   * Get cache statistics for monitoring
   * Combines local db cache stats with global cache stats from @g-1/util
   */
  protected getDbCacheStats() {
    const globalStats = getCacheStats()
    return {
      dbCache: {
        size: BaseRepository.dbCache.size,
        keys: Array.from(BaseRepository.dbCache.keys()),
      },
      globalCache: globalStats,
    }
  }
}

export function clearRepositoryCaches() {
  BaseRepository.clearDbCache()
}
