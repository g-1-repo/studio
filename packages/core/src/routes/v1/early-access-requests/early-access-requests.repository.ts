import type { InferSelectModel } from 'drizzle-orm'

import type { Environment } from '@/env'

import { paginate } from '@g-1/util/database'
import { count, desc, eq } from 'drizzle-orm'

import { earlyAccessRequestsTable } from '@/db/schema'
import { BaseRepository } from '@/lib/base-repository'
import { takeFirstOrThrow } from '@/lib/utils/drizzle'

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */
type Create = Pick<InferSelectModel<typeof earlyAccessRequestsTable>, 'email'>

/* -------------------------------------------------------------------------- */
/*                            Optimized Repository                            */
/* -------------------------------------------------------------------------- */

/**
 * Early Access Requests Repository with optimized database operations
 *
 * Features:
 * - Connection pooling and caching via BaseRepository
 * - Performance monitoring for all database operations
 * - Batch operations for improved throughput
 * - Pagination support for large datasets
 * - Error handling and retry logic
 */
export class EarlyAccessRequestsRepository extends BaseRepository {
  /**
   * Get all early access requests
   */
  async getAll(env: Environment) {
    return this.executeQuery(
      env,
      async ({ db }) => {
        return await db.select().from(earlyAccessRequestsTable)
      },
      'getAll',
    )
  }

  /**
   * Find early access request by email address
   */
  async findOneByEmail(email: string, env: Environment) {
    return this.executeQuery(
      env,
      async ({ db }) => {
        const row = await db.query.earlyAccessRequestsTable.findFirst({
          where: eq(earlyAccessRequestsTable.email, email),
        })
        return row ?? null
      },
      'findOneByEmail',
    )
  }

  /**
   * Create new early access request
   */
  async create(data: Create, env: Environment) {
    return this.executeQuery(
      env,
      async ({ db }) => {
        return await db
          .insert(earlyAccessRequestsTable)
          .values(data)
          .returning()
          .then(takeFirstOrThrow)
      },
      'create',
    )
  }

  /**
   * Remove early access request by ID
   */
  async remove(id: string, env: Environment) {
    return this.executeQuery(
      env,
      async ({ db }) => {
        return await db
          .delete(earlyAccessRequestsTable)
          .where(eq(earlyAccessRequestsTable.id, id))
      },
      'remove',
    )
  }

  /**
   * OPTIMIZATION: Create multiple early access requests in a single transaction
   * Significantly improves performance for batch operations
   */
  async createBatch(data: Create[], env: Environment) {
    return this.executeQuery(
      env,
      async ({ db }) => {
        return await db
          .insert(earlyAccessRequestsTable)
          .values(data)
          .returning()
      },
      'createBatch',
    )
  }

  /**
   * OPTIMIZATION: Get paginated early access requests for large datasets
   * Uses standardized pagination from @g-1/util
   */
  async getAllPaginated(env: Environment, page = 1, limit = 50) {
    return this.executeQuery(
      env,
      async ({ db }) => {
        // Get total count first
        const totalCountResult = await db
          .select({ count: count() })
          .from(earlyAccessRequestsTable)
        const totalCount = Number(totalCountResult[0].count)

        // Get items with manual pagination calculation
        const offset = (page - 1) * limit
        const items = await db
          .select()
          .from(earlyAccessRequestsTable)
          .limit(limit)
          .offset(offset)
          .orderBy(desc(earlyAccessRequestsTable.createdAt)) // Newest first

        // Use standardized pagination from @g-1/util
        const paginationResult = paginate(items, page, limit)

        return {
          items,
          pagination: {
            ...paginationResult,
            totalCount,
            offset,
          },
        }
      },
      'getAllPaginated',
    )
  }

  /**
   * OPTIMIZATION: Count total early access requests efficiently
   * Useful for dashboard statistics without loading all data
   */
  async getCount(env: Environment) {
    return this.executeQuery(
      env,
      async ({ db }) => {
        const result = await db
          .select({ count: count() })
          .from(earlyAccessRequestsTable)
        return Number(result[0].count)
      },
      'getCount',
    )
  }

  /**
   * OPTIMIZATION: Check if email already exists (faster than findOneByEmail for existence checks)
   */
  async emailExists(email: string, env: Environment): Promise<boolean> {
    return this.executeQuery(
      env,
      async ({ db }) => {
        const row = await db
          .select({ one: earlyAccessRequestsTable.id })
          .from(earlyAccessRequestsTable)
          .where(eq(earlyAccessRequestsTable.email, email))
          .limit(1)
        return row.length > 0
      },
      'emailExists',
    )
  }

  /**
   * OPTIMIZATION: Get recent early access requests for dashboard
   */
  async getRecent(env: Environment, limit = 10) {
    return this.executeQuery(
      env,
      async ({ db }) => {
        return await db
          .select()
          .from(earlyAccessRequestsTable)
          .orderBy(desc(earlyAccessRequestsTable.createdAt))
          .limit(limit)
      },
      'getRecent',
    )
  }
}
