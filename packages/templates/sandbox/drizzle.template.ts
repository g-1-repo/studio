import Database from 'better-sqlite3'
import { and, asc, avg, count, desc, eq, max, min, or, sql, sum } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import {
  datetime,
  int,
  boolean as mysqlBoolean,
  json as mysqlJson,
  mysqlTable,
  varchar as mysqlVarchar,
} from 'drizzle-orm/mysql-core'
import { drizzle as drizzleMySQL } from 'drizzle-orm/mysql2'
import { migrate as migrateMySQL } from 'drizzle-orm/mysql2/migrator'
import { boolean, json, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import mysql from 'mysql2/promise'
import postgres from 'postgres'

export type DatabaseType = 'sqlite' | 'postgres' | 'mysql' | 'd1'

export interface DatabaseConfig {
  type: DatabaseType
  url?: string
  host?: string
  port?: number
  database?: string
  username?: string
  password?: string
  ssl?: boolean
  maxConnections?: number
  connectionTimeout?: number
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
 * PostgreSQL Database Configuration
 */
export interface PostgresConfig extends DatabaseConfig {
  type: 'postgres'
  url: string
  ssl?:
    | boolean
    | {
        rejectUnauthorized?: boolean
        ca?: string
        cert?: string
        key?: string
      }
  max?: number
  idle_timeout?: number
  connect_timeout?: number
}

/**
 * MySQL Database Configuration
 */
export interface MySQLConfig extends DatabaseConfig {
  type: 'mysql'
  host: string
  port?: number
  user: string
  password: string
  database: string
  ssl?: boolean | object
  acquireTimeout?: number
  timeout?: number
  reconnect?: boolean
}

/**
 * Cloudflare D1 Database Configuration
 */
export interface D1Config extends DatabaseConfig {
  type: 'd1'
  binding: unknown // D1Database binding
}

/**
 * Example table schemas for different databases
 */

// SQLite Tables
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

// PostgreSQL Tables
export const postgresUsersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatar: varchar('avatar', { length: 500 }),
  emailVerified: boolean('email_verified').default(false),
  isActive: boolean('is_active').default(true),
  roles: json('roles').$type<string[]>().default([]),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const postgresPostsTable = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  content: text('content'),
  excerpt: varchar('excerpt', { length: 500 }),
  authorId: uuid('author_id')
    .notNull()
    .references(() => postgresUsersTable.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20, enum: ['draft', 'published', 'archived'] }).default(
    'draft'
  ),
  tags: json('tags').$type<string[]>().default([]),
  metadata: json('metadata').$type<Record<string, unknown>>().default({}),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// MySQL Tables
export const mysqlUsersTable = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: mysqlVarchar('email', { length: 255 }).notNull().unique(),
  username: mysqlVarchar('username', { length: 50 }).unique(),
  passwordHash: mysqlVarchar('password_hash', { length: 255 }),
  firstName: mysqlVarchar('first_name', { length: 100 }),
  lastName: mysqlVarchar('last_name', { length: 100 }),
  avatar: mysqlVarchar('avatar', { length: 500 }),
  emailVerified: mysqlBoolean('email_verified').default(false),
  isActive: mysqlBoolean('is_active').default(true),
  roles: mysqlJson('roles').$type<string[]>(),
  metadata: mysqlJson('metadata').$type<Record<string, unknown>>(),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
})

export const mysqlPostsTable = mysqlTable('posts', {
  id: int('id').autoincrement().primaryKey(),
  title: mysqlVarchar('title', { length: 255 }).notNull(),
  slug: mysqlVarchar('slug', { length: 255 }).notNull().unique(),
  content: text('content'),
  excerpt: mysqlVarchar('excerpt', { length: 500 }),
  authorId: int('author_id')
    .notNull()
    .references(() => mysqlUsersTable.id, { onDelete: 'cascade' }),
  status: mysqlVarchar('status', { length: 20 }).default('draft'),
  tags: mysqlJson('tags').$type<string[]>(),
  metadata: mysqlJson('metadata').$type<Record<string, unknown>>(),
  publishedAt: datetime('published_at'),
  createdAt: datetime('created_at').notNull(),
  updatedAt: datetime('updated_at').notNull(),
})

/**
 * Database Manager Class
 */
export class DrizzleDatabaseManager {
  private db: unknown
  private config: DatabaseConfig
  private connectionPool?: unknown

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    switch (this.config.type) {
      case 'sqlite':
        await this.initializeSQLite(this.config as SQLiteConfig)
        break
      case 'postgres':
        await this.initializePostgres(this.config as PostgresConfig)
        break
      case 'mysql':
        await this.initializeMySQL(this.config as MySQLConfig)
        break
      case 'd1':
        await this.initializeD1(this.config as D1Config)
        break
      default:
        throw new Error(`Unsupported database type: ${this.config.type}`)
    }
  }

  /**
   * Initialize SQLite database
   */
  private async initializeSQLite(config: SQLiteConfig): Promise<void> {
    const filename = config.filename || config.url || ':memory:'
    const sqlite = new Database(filename, {
      readonly: config.readonly,
      fileMustExist: config.fileMustExist,
      timeout: config.timeout || 5000,
      verbose: config.verbose ? console.log : undefined,
    })

    this.db = drizzle(sqlite, {
      schema: config.schema as any,
      casing: 'snake_case',
    })

    // Enable WAL mode for better performance
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('synchronous = NORMAL')
    sqlite.pragma('cache_size = 1000000')
    sqlite.pragma('foreign_keys = ON')
    sqlite.pragma('temp_store = MEMORY')
  }

  /**
   * Initialize PostgreSQL database
   */
  private async initializePostgres(config: PostgresConfig): Promise<void> {
    const client = postgres(config.url, {
      ssl: config.ssl,
      max: config.max || 10,
      idle_timeout: config.idle_timeout || 20,
      connect_timeout: config.connect_timeout || 10,
    })

    this.connectionPool = client
    this.db = drizzlePostgres(sql, {
      schema: config.schema as any,
      casing: 'snake_case',
    })
  }

  /**
   * Initialize MySQL database
   */
  private async initializeMySQL(config: MySQLConfig): Promise<void> {
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl,
      acquireTimeout: config.acquireTimeout || 60000,
      timeout: config.timeout || 60000,
      reconnect: config.reconnect !== false,
    })

    this.connectionPool = connection
    this.db = drizzleMySQL(connection, {
      schema: config.schema as any,
      mode: 'default',
      casing: 'snake_case',
    })
  }

  /**
   * Initialize Cloudflare D1 database
   */
  private async initializeD1(config: D1Config): Promise<void> {
    if (!config.binding) {
      throw new Error('D1 database binding is required')
    }

    this.db = drizzleD1(config.binding as any, {
      schema: config.schema as any,
      casing: 'snake_case',
    })
  }

  /**
   * Run database migrations
   */
  async migrate(migrationsFolder?: string): Promise<void> {
    const folder = migrationsFolder || this.config.migrationsFolder || './migrations'

    switch (this.config.type) {
      case 'sqlite':
        await migrate(this.db, { migrationsFolder: folder })
        break
      case 'postgres':
        await migratePostgres(this.db, { migrationsFolder: folder })
        break
      case 'mysql':
        await migrateMySQL(this.db, { migrationsFolder: folder })
        break
      case 'd1':
        // D1 migrations are handled via Wrangler CLI
        console.log('D1 migrations should be run via Wrangler CLI')
        break
    }
  }

  /**
   * Get database instance
   */
  getDb(): unknown {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
    return this.db
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.connectionPool) {
      if (this.config.type === 'postgres') {
        await this.connectionPool.end()
      } else if (this.config.type === 'mysql') {
        await this.connectionPool.end()
      }
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      switch (this.config.type) {
        case 'sqlite':
        case 'd1':
          await this.db.run(sql`SELECT 1`)
          break
        case 'postgres':
        case 'mysql':
          await this.db.execute(sql`SELECT 1`)
          break
      }
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

/**
 * Repository base class with common CRUD operations
 */
export abstract class BaseRepository<T extends Record<string, unknown>> {
  protected db: unknown
  protected table: unknown

  constructor(db: unknown, table: unknown) {
    this.db = db
    this.table = table
  }

  /**
   * Find by ID
   */
  async findById(id: string | number): Promise<T | null> {
    const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1)

    return result[0] || null
  }

  /**
   * Find all with optional filtering
   */
  async findAll(
    options: { where?: unknown; orderBy?: unknown; limit?: number; offset?: number } = {}
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
   * Create new record
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date()
    const insertData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    }

    const result = await (this.db as any).insert(this.table).values(insertData).returning()

    return result[0]
  }

  /**
   * Update record
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
   * Delete record
   */
  async delete(id: string | number): Promise<boolean> {
    const result = await this.db.delete(this.table).where(eq(this.table.id, id))

    return result.changes > 0
  }

  /**
   * Count records
   */
  async count(where?: unknown): Promise<number> {
    let query = this.db.select({ count: count() }).from(this.table)

    if (where) {
      query = query.where(where)
    }

    const result = await query
    return result[0].count
  }

  /**
   * Check if record exists
   */
  async exists(where: unknown): Promise<boolean> {
    const result = await this.db.select({ count: count() }).from(this.table).where(where)

    return result[0].count > 0
  }
}

/**
 * Query builder helpers
 */
export const QueryHelpers = {
  // Pagination
  paginate: (page: number, pageSize: number) => ({
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }),

  // Search helpers
  searchText: (column: any, term: string) => sql`${column} LIKE ${`%${term}%`}`,

  // Date range filters
  dateRange: (column: any, start: Date, end: Date) =>
    and(sql`${column} >= ${start}`, sql`${column} <= ${end}`),

  // Common sorting
  sortBy: {
    newest: (column: any) => desc(column),
    oldest: (column: any) => asc(column),
    alphabetical: (column: any) => asc(column),
  },

  // Aggregations
  aggregations: {
    count,
    sum,
    avg,
    min,
    max,
  },
}

/**
 * Transaction helper
 */
export async function withTransaction<T>(
  db: unknown,
  callback: (tx: unknown) => Promise<T>
): Promise<T> {
  return await db.transaction(callback)
}

/**
 * Database factory function
 */
export async function createDatabase(config: DatabaseConfig): Promise<DrizzleDatabaseManager> {
  const manager = new DrizzleDatabaseManager(config)
  await manager.initialize()
  return manager
}

// Export common Drizzle utilities
export { sql, eq, and, or, desc, asc, count, sum, avg, min, max }

export default DrizzleDatabaseManager
