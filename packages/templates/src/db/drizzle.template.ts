// import Database from 'better-sqlite3'
import { and, asc, avg, count, desc, eq, max, min, or, sql, sum } from 'drizzle-orm'
// import { drizzle } from 'drizzle-orm/better-sqlite3'
// import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export type DatabaseType = 'sqlite'

export interface DatabaseConfig {
  type: DatabaseType
  filename?: string
  memory?: boolean
  readonly?: boolean
  fileMustExist?: boolean
  timeout?: number
  verbose?: boolean
  migrationsFolder?: string
  schema?: Record<string, unknown>
}

/**
 * SQLite Database Configuration
 */
export interface SQLiteConfig extends DatabaseConfig {
  type: 'sqlite'
  filename?: string
  memory?: boolean
  readonly?: boolean
  fileMustExist?: boolean
  timeout?: number
  verbose?: boolean
}

/**
 * SQLite Users Table Schema
 */
export const sqliteUsersTable = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull().unique(),
    username: text('username').unique(),
    passwordHash: text('password_hash'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    avatar: text('avatar'),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    roles: text('roles', { mode: 'json' }).$type<string[]>().default([]),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => ({
    emailIdx: uniqueIndex('email_idx').on(table.email),
    usernameIdx: index('username_idx').on(table.username),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
  })
)

/**
 * SQLite Posts Table Schema
 */
export const sqlitePostsTable = sqliteTable(
  'posts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    content: text('content'),
    excerpt: text('excerpt'),
    authorId: integer('author_id')
      .notNull()
      .references(() => sqliteUsersTable.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, unknown>>().default({}),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  table => ({
    slugIdx: uniqueIndex('slug_idx').on(table.slug),
    authorIdx: index('author_idx').on(table.authorId),
    statusIdx: index('status_idx').on(table.status),
    publishedAtIdx: index('published_at_idx').on(table.publishedAt),
  })
)

/**
 * SQLite Database Manager
 * Simplified version that only supports SQLite databases
 */
export class DrizzleDatabaseManager {
  private db: any
  private config: SQLiteConfig
  private database?: any // Database.Database

  constructor(config: SQLiteConfig) {
    this.config = config
  }

  /**
   * Initialize the SQLite database connection
   */
  async initialize(): Promise<void> {
    await this.initializeSQLite(this.config)
  }

  /**
   * Initialize SQLite database
   */
  private async initializeSQLite(config: SQLiteConfig): Promise<void> {
    try {
      const dbPath = config.filename || (config.memory ? ':memory:' : './database.db')
      
      // this.database = new Database(dbPath, {
      //   readonly: config.readonly || false,
      //   fileMustExist: config.fileMustExist || false,
      //   timeout: config.timeout || 5000,
      //   verbose: config.verbose ? console.log : undefined,
      // })

      // this.db = drizzle(this.database, { schema: config.schema })
      
      // Placeholder implementation - requires better-sqlite3 to be installed
      throw new Error('Database initialization requires better-sqlite3 package to be installed')
    } catch (error) {
      throw new Error(`Failed to initialize SQLite database: ${error}`)
    }
  }

  /**
   * Run database migrations
   */
  async migrate(migrationsFolder?: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized')
    }

    try {
      const folder = migrationsFolder || this.config.migrationsFolder || './migrations'
      // await migrate(this.db, { migrationsFolder: folder })
      
      // Placeholder implementation - requires better-sqlite3 to be installed
      throw new Error('Migration requires better-sqlite3 package to be installed')
    } catch (error) {
      throw new Error(`Migration failed: ${error}`)
    }
  }

  /**
   * Get the database instance
   */
  getDb(): any {
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.database) {
      this.database.close()
    }
  }

  /**
   * Perform a health check on the database
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.db) return false
      
      // Simple query to test connection
      await this.db.select().from(sqliteUsersTable).limit(1)
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

/**
 * Base Repository Class for SQLite operations
 */
export abstract class BaseRepository<T extends Record<string, unknown>> {
  protected db: any
  protected table: any

  constructor(db: any, table: any) {
    this.db = db
    this.table = table
  }

  /**
   * Find a record by ID
   */
  async findById(id: string | number): Promise<T | null> {
    const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1)
    return result[0] || null
  }

  /**
   * Find all records with optional filtering and pagination
   */
  async findAll(
    options: { where?: any; orderBy?: any; limit?: number; offset?: number } = {}
  ): Promise<T[]> {
    let query = this.db.select().from(this.table)

    if (options.where) {
      query = query.where(options.where)
    }

    if (options.orderBy) {
      query = query.orderBy(options.orderBy)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.offset(options.offset)
    }

    return await query
  }

  /**
   * Create a new record
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const insertData = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await (this.db as any).insert(this.table).values(insertData).returning()
    return result[0]
  }

  /**
   * Update a record by ID
   */
  async update(id: string | number, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<T | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    }

    const result = await this.db
      .update(this.table)
      .set(updateData)
      .where(eq(this.table.id, id))
      .returning()

    return result[0] || null
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string | number): Promise<boolean> {
    const result = await this.db.delete(this.table).where(eq(this.table.id, id))
    return result.changes > 0
  }

  /**
   * Count records with optional filtering
   */
  async count(where?: any): Promise<number> {
    let query = this.db.select({ count: count() }).from(this.table)

    if (where) {
      query = query.where(where)
    }

    const result = await query
    return result[0]?.count || 0
  }

  /**
   * Check if a record exists
   */
  async exists(where: any): Promise<boolean> {
    const result = await this.count(where)
    return result > 0
  }
}

/**
 * Query Helper Functions
 */
export const QueryHelpers = {
  /**
   * Pagination helper
   */
  paginate: (page: number, pageSize: number) => ({
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }),

  /**
   * Text search helper
   */
  searchText: (column: any, term: string) => sql`${column} LIKE ${`%${term}%`}`,

  /**
   * Date range helper
   */
  dateRange: (column: any, start: Date, end: Date) =>
    and(sql`${column} >= ${start}`, sql`${column} <= ${end}`),

  /**
   * Sorting helpers
   */
  sortBy: {
    newest: (column: any) => desc(column),
    oldest: (column: any) => asc(column),
    alphabetical: (column: any) => asc(column),
  },

  /**
   * Aggregation functions
   */
  aggregations: {
    count,
    sum,
    avg,
    min,
    max,
  },
}

/**
 * Transaction wrapper
 */
export async function withTransaction<T>(
  db: any,
  callback: (tx: any) => Promise<T>
): Promise<T> {
  return await db.transaction(callback)
}

/**
 * Database factory function
 */
export async function createDatabase(config: SQLiteConfig): Promise<DrizzleDatabaseManager> {
  const manager = new DrizzleDatabaseManager(config)
  await manager.initialize()
  return manager
}

// Export commonly used Drizzle ORM functions
export { sql, eq, and, or, desc, asc, count, sum, avg, min, max }

export default DrizzleDatabaseManager