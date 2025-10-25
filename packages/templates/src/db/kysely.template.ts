import {
  Kysely,
  PostgresDialect,
  MysqlDialect,
  SqliteDialect,
  CamelCasePlugin,
  DeduplicateJoinsPlugin,
  ParseJSONResultsPlugin,
  sql,
  Transaction,
  SelectQueryBuilder,
  InsertQueryBuilder,
  UpdateQueryBuilder,
  DeleteQueryBuilder,
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable
} from 'kysely'
import { Pool } from 'pg'
import { createPool } from 'mysql2'
import Database from 'better-sqlite3'
import type { Context } from 'hono'

export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite'

export interface KyselyConfig {
  provider: DatabaseProvider
  connectionString: string
  pool?: {
    min?: number
    max?: number
    acquireTimeoutMillis?: number
    createTimeoutMillis?: number
    destroyTimeoutMillis?: number
    idleTimeoutMillis?: number
    reapIntervalMillis?: number
    createRetryIntervalMillis?: number
  }
  ssl?: boolean | {
    rejectUnauthorized?: boolean
    ca?: string
    cert?: string
    key?: string
  }
  debug?: boolean
  plugins?: ('camelCase' | 'deduplicateJoins' | 'parseJSON')[]
}

/**
 * Database schema interfaces
 */
export interface UserTable {
  id: Generated<string>
  email: string
  username: string | null
  password_hash: string | null
  first_name: string | null
  last_name: string | null
  avatar: string | null
  email_verified: boolean
  is_active: boolean
  roles: string // JSON string
  metadata: string // JSON string
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string>
}

export interface PostTable {
  id: Generated<string>
  title: string
  slug: string
  content: string | null
  excerpt: string | null
  author_id: string
  status: 'draft' | 'published' | 'archived'
  tags: string // JSON string
  metadata: string // JSON string
  published_at: Date | null
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string>
}

export interface SessionTable {
  id: Generated<string>
  user_id: string
  token: string
  expires_at: Date
  created_at: ColumnType<Date, string | undefined, never>
}

export interface AccountTable {
  id: Generated<string>
  user_id: string
  type: string
  provider: string
  provider_account_id: string
  refresh_token: string | null
  access_token: string | null
  expires_at: number | null
  token_type: string | null
  scope: string | null
  id_token: string | null
  session_state: string | null
}

export interface Database {
  users: UserTable
  posts: PostTable
  sessions: SessionTable
  accounts: AccountTable
}

// Type helpers
export type User = Selectable<UserTable>
export type NewUser = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

export type Post = Selectable<PostTable>
export type NewPost = Insertable<PostTable>
export type PostUpdate = Updateable<PostTable>

export type Session = Selectable<SessionTable>
export type NewSession = Insertable<SessionTable>
export type SessionUpdate = Updateable<SessionTable>

export type Account = Selectable<AccountTable>
export type NewAccount = Insertable<AccountTable>
export type AccountUpdate = Updateable<AccountTable>

/**
 * SQL migration templates
 */
export const KYSELY_MIGRATIONS = {
  postgresql: {
    '001_create_users_table': `
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  roles JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
`,

    '002_create_posts_table': `
CREATE TABLE posts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);
`,

    '003_create_sessions_table': `
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
`,

    '004_create_accounts_table': `
CREATE TABLE accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_provider ON accounts(provider, provider_account_id);
`
  },

  mysql: {
    '001_create_users_table': `
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar VARCHAR(500),
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  roles JSON DEFAULT ('[]'),
  metadata JSON DEFAULT ('{}'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
`,

    '002_create_posts_table': `
CREATE TABLE posts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  excerpt VARCHAR(500),
  author_id VARCHAR(36) NOT NULL,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  tags JSON DEFAULT ('[]'),
  metadata JSON DEFAULT ('{}'),
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);
`
  },

  sqlite: `
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar TEXT,
  email_verified BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  roles TEXT DEFAULT '[]',
  metadata TEXT DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

CREATE TABLE posts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT,
  excerpt TEXT,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  tags TEXT DEFAULT '[]',
  metadata TEXT DEFAULT '{}',
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
`
}

/**
 * Kysely Database Manager
 */
export class KyselyManager {
  private db: Kysely<Database>
  private config: KyselyConfig

  constructor(config: KyselyConfig) {
    this.config = config
    this.db = this.createDatabase()
  }

  private createDatabase(): Kysely<Database> {
    let dialect: any

    switch (this.config.provider) {
      case 'postgresql':
        dialect = new PostgresDialect({
          pool: new Pool({
            connectionString: this.config.connectionString,
            min: this.config.pool?.min || 0,
            max: this.config.pool?.max || 10,
            acquireTimeoutMillis: this.config.pool?.acquireTimeoutMillis || 60000,
            createTimeoutMillis: this.config.pool?.createTimeoutMillis || 30000,
            destroyTimeoutMillis: this.config.pool?.destroyTimeoutMillis || 5000,
            idleTimeoutMillis: this.config.pool?.idleTimeoutMillis || 600000,
            reapIntervalMillis: this.config.pool?.reapIntervalMillis || 1000,
            createRetryIntervalMillis: this.config.pool?.createRetryIntervalMillis || 200,
            ssl: this.config.ssl
          })
        })
        break

      case 'mysql':
        dialect = new MysqlDialect({
          pool: createPool({
            uri: this.config.connectionString,
            connectionLimit: this.config.pool?.max || 10,
            acquireTimeout: this.config.pool?.acquireTimeoutMillis || 60000,
            timeout: this.config.pool?.createTimeoutMillis || 30000,
            ssl: this.config.ssl
          })
        })
        break

      case 'sqlite':
        dialect = new SqliteDialect({
          database: new Database(this.config.connectionString)
        })
        break

      default:
        throw new Error(`Unsupported database provider: ${this.config.provider}`)
    }

    const plugins = []
    
    if (this.config.plugins?.includes('camelCase')) {
      plugins.push(new CamelCasePlugin())
    }
    
    if (this.config.plugins?.includes('deduplicateJoins')) {
      plugins.push(new DeduplicateJoinsPlugin())
    }
    
    if (this.config.plugins?.includes('parseJSON')) {
      plugins.push(new ParseJSONResultsPlugin())
    }

    return new Kysely<Database>({
      dialect,
      plugins,
      log: this.config.debug ? ['query', 'error'] : undefined
    })
  }

  /**
   * Get Kysely database instance
   */
  getDb(): Kysely<Database> {
    return this.db
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1`.execute(this.db)
      return true
    } catch (error) {
      console.error('Kysely health check failed:', error)
      return false
    }
  }

  /**
   * Execute transaction
   */
  async transaction<T>(
    callback: (trx: Transaction<Database>) => Promise<T>
  ): Promise<T> {
    return await this.db.transaction().execute(callback)
  }

  /**
   * Close database connection
   */
  async destroy(): Promise<void> {
    await this.db.destroy()
  }

  /**
   * Execute raw SQL
   */
  async executeRaw(query: string): Promise<any> {
    return await sql.raw(query).execute(this.db)
  }
}

/**
 * Base repository class with common CRUD operations
 */
export abstract class KyselyRepository<
  Table extends keyof Database,
  SelectType,
  InsertType,
  UpdateType
> {
  protected db: Kysely<Database>
  protected tableName: Table

  constructor(db: Kysely<Database>, tableName: Table) {
    this.db = db
    this.tableName = tableName
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<SelectType | undefined> {
    return await this.db
      .selectFrom(this.tableName)
      .selectAll()
      .where('id' as any, '=', id)
      .executeTakeFirst() as SelectType | undefined
  }

  /**
   * Find first matching record
   */
  async findFirst(
    where: Partial<SelectType>,
    orderBy?: { column: keyof SelectType; direction: 'asc' | 'desc' }
  ): Promise<SelectType | undefined> {
    let query = this.db
      .selectFrom(this.tableName)
      .selectAll()

    // Apply where conditions
    for (const [key, value] of Object.entries(where)) {
      if (value !== undefined) {
        query = query.where(key as any, '=', value)
      }
    }

    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy.column as any, orderBy.direction)
    }

    return await query.executeTakeFirst() as SelectType | undefined
  }

  /**
   * Find many records
   */
  async findMany(options: {
    where?: Partial<SelectType>
    orderBy?: { column: keyof SelectType; direction: 'asc' | 'desc' }[]
    limit?: number
    offset?: number
  } = {}): Promise<SelectType[]> {
    let query = this.db
      .selectFrom(this.tableName)
      .selectAll()

    // Apply where conditions
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (value !== undefined) {
          query = query.where(key as any, '=', value)
        }
      }
    }

    // Apply ordering
    if (options.orderBy) {
      for (const order of options.orderBy) {
        query = query.orderBy(order.column as any, order.direction)
      }
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit)
    }
    if (options.offset) {
      query = query.offset(options.offset)
    }

    return await query.execute() as SelectType[]
  }

  /**
   * Create new record
   */
  async create(data: InsertType): Promise<SelectType> {
    const result = await this.db
      .insertInto(this.tableName)
      .values(data as any)
      .returningAll()
      .executeTakeFirstOrThrow()

    return result as SelectType
  }

  /**
   * Create many records
   */
  async createMany(data: InsertType[]): Promise<SelectType[]> {
    const result = await this.db
      .insertInto(this.tableName)
      .values(data as any)
      .returningAll()
      .execute()

    return result as SelectType[]
  }

  /**
   * Update record
   */
  async update(id: string, data: UpdateType): Promise<SelectType | undefined> {
    const result = await this.db
      .updateTable(this.tableName)
      .set(data as any)
      .where('id' as any, '=', id)
      .returningAll()
      .executeTakeFirst()

    return result as SelectType | undefined
  }

  /**
   * Update many records
   */
  async updateMany(
    where: Partial<SelectType>,
    data: UpdateType
  ): Promise<number> {
    let query = this.db
      .updateTable(this.tableName)
      .set(data as any)

    // Apply where conditions
    for (const [key, value] of Object.entries(where)) {
      if (value !== undefined) {
        query = query.where(key as any, '=', value)
      }
    }

    const result = await query.execute()
    return Number(result[0]?.numUpdatedRows || 0)
  }

  /**
   * Delete record
   */
  async delete(id: string): Promise<SelectType | undefined> {
    const result = await this.db
      .deleteFrom(this.tableName)
      .where('id' as any, '=', id)
      .returningAll()
      .executeTakeFirst()

    return result as SelectType | undefined
  }

  /**
   * Delete many records
   */
  async deleteMany(where: Partial<SelectType>): Promise<number> {
    let query = this.db.deleteFrom(this.tableName)

    // Apply where conditions
    for (const [key, value] of Object.entries(where)) {
      if (value !== undefined) {
        query = query.where(key as any, '=', value)
      }
    }

    const result = await query.execute()
    return Number(result[0]?.numDeletedRows || 0)
  }

  /**
   * Count records
   */
  async count(where?: Partial<SelectType>): Promise<number> {
    let query = this.db
      .selectFrom(this.tableName)
      .select(sql`COUNT(*)`.as('count'))

    // Apply where conditions
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        if (value !== undefined) {
          query = query.where(key as any, '=', value)
        }
      }
    }

    const result = await query.executeTakeFirstOrThrow()
    return Number(result.count)
  }

  /**
   * Check if record exists
   */
  async exists(where: Partial<SelectType>): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }
}

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export class KyselyPaginationHelper {
  /**
   * Paginate query results
   */
  static async paginate<T>(
    query: SelectQueryBuilder<Database, any, T>,
    countQuery: SelectQueryBuilder<Database, any, { count: string }>,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const page = options.page || 1
    const pageSize = options.pageSize || 10
    const offset = (page - 1) * pageSize

    const [data, countResult] = await Promise.all([
      query.limit(pageSize).offset(offset).execute(),
      countQuery.executeTakeFirstOrThrow()
    ])

    const total = Number(countResult.count)
    const totalPages = Math.ceil(total / pageSize)

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  }
}

/**
 * Query builder helpers
 */
export class KyselyQueryHelpers {
  /**
   * Build search query with multiple fields
   */
  static buildSearchQuery<T extends keyof Database>(
    db: Kysely<Database>,
    table: T,
    searchTerm: string,
    searchFields: (keyof Database[T])[]
  ) {
    let query = db.selectFrom(table).selectAll()

    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map(field =>
        sql`${sql.ref(field as string)} ILIKE ${`%${searchTerm}%`}`
      )

      query = query.where(sql`${sql.join(searchConditions, sql` OR `)}`)
    }

    return query
  }

  /**
   * Build filter query with multiple conditions
   */
  static buildFilterQuery<T extends keyof Database>(
    query: SelectQueryBuilder<Database, T, any>,
    filters: Record<string, any>
  ) {
    let filteredQuery = query

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          filteredQuery = filteredQuery.where(key as any, 'in', value)
        } else if (typeof value === 'string' && value.includes('%')) {
          filteredQuery = filteredQuery.where(key as any, 'like', value)
        } else {
          filteredQuery = filteredQuery.where(key as any, '=', value)
        }
      }
    }

    return filteredQuery
  }
}

/**
 * Kysely middleware for Hono
 */
export function createKyselyMiddleware(kyselyManager: KyselyManager) {
  return async (c: Context, next: () => Promise<void>) => {
    c.set('kysely', kyselyManager.getDb())
    c.set('db', kyselyManager.getDb()) // Alias for convenience
    
    try {
      await next()
    } finally {
      // Cleanup if needed
    }
  }
}

/**
 * Factory function to create Kysely manager
 */
export function createKyselyManager(config: KyselyConfig): KyselyManager {
  return new KyselyManager(config)
}

// Export Kysely types for convenience
export type { Kysely, Transaction, sql }

export default KyselyManager