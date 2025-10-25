// import type { Prisma, PrismaClient } from '@prisma/client'
import type { Context } from 'hono'

// Using any types for template compatibility - actual types should be imported at runtime
export type Prisma = any
export type PrismaClient = any

export type DatabaseProvider =
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'sqlserver'
  | 'mongodb'
  | 'cockroachdb'

export interface PrismaConfig {
  provider: DatabaseProvider
  url: string
  shadowDatabaseUrl?: string
  directUrl?: string
  relationMode?: 'prisma' | 'foreignKeys'
  logging?: boolean | Prisma.LogLevel[]
  errorFormat?: 'pretty' | 'colorless' | 'minimal'
  transactionOptions?: {
    maxWait?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
  }
  connectionPool?: {
    connectionLimit?: number
    poolTimeout?: number
  }
}

/**
 * Prisma schema examples for different providers
 */
export const PRISMA_SCHEMAS = {
  postgresql: `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  passwordHash  String?   @map("password_hash")
  firstName     String?   @map("first_name")
  lastName      String?   @map("last_name")
  avatar        String?
  emailVerified Boolean   @default(false) @map("email_verified")
  isActive      Boolean   @default(true) @map("is_active")
  roles         String[]  @default([])
  metadata      Json      @default("{}")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  posts         Post[]
  sessions      Session[]
  accounts      Account[]

  @@map("users")
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String?
  excerpt     String?
  authorId    String    @map("author_id")
  status      PostStatus @default(DRAFT)
  tags        String[]  @default([])
  metadata    Json      @default("{}")
  publishedAt DateTime? @map("published_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("posts")
}

model Session {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refreshToken      String? @map("refresh_token")
  accessToken       String? @map("access_token")
  expiresAt         Int?    @map("expires_at")
  tokenType         String? @map("token_type")
  scope             String?
  idToken           String? @map("id_token")
  sessionState      String? @map("session_state")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
`,

  mysql: `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique @db.VarChar(255)
  username      String?   @unique @db.VarChar(50)
  passwordHash  String?   @map("password_hash") @db.VarChar(255)
  firstName     String?   @map("first_name") @db.VarChar(100)
  lastName      String?   @map("last_name") @db.VarChar(100)
  avatar        String?   @db.VarChar(500)
  emailVerified Boolean   @default(false) @map("email_verified")
  isActive      Boolean   @default(true) @map("is_active")
  roles         Json      @default("[]")
  metadata      Json      @default("{}")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  posts         Post[]
  sessions      Session[]
  accounts      Account[]

  @@map("users")
}

model Post {
  id          String    @id @default(cuid())
  title       String    @db.VarChar(255)
  slug        String    @unique @db.VarChar(255)
  content     String?   @db.Text
  excerpt     String?   @db.VarChar(500)
  authorId    String    @map("author_id")
  status      PostStatus @default(DRAFT)
  tags        Json      @default("[]")
  metadata    Json      @default("{}")
  publishedAt DateTime? @map("published_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("posts")
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
`,

  sqlite: `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  passwordHash  String?
  firstName     String?
  lastName      String?
  avatar        String?
  emailVerified Boolean   @default(false)
  isActive      Boolean   @default(true)
  roles         String    @default("[]") // JSON string for SQLite
  metadata      String    @default("{}")  // JSON string for SQLite
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  posts         Post[]
  sessions      Session[]
  accounts      Account[]
}

model Post {
  id          String    @id @default(cuid())
  title       String
  slug        String    @unique
  content     String?
  excerpt     String?
  authorId    String
  status      String    @default("DRAFT") // Enum as string for SQLite
  tags        String    @default("[]")    // JSON string for SQLite
  metadata    String    @default("{}")    // JSON string for SQLite
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
`,
}

/**
 * Prisma Client Manager
 */
export class PrismaManager {
  private client: PrismaClient | null = null
  private config: PrismaConfig

  constructor(config: PrismaConfig) {
    this.config = config
    // Template implementation - actual Prisma client instantiation would be done at runtime
    // this.client = new PrismaClient({
    //   datasources: {
    //     db: {
    //       url: config.url,
    //     },
    //   },
    //   log:
    //     config.logging === true
    //       ? ['query', 'info', 'warn', 'error']
    //       : Array.isArray(config.logging)
    //         ? config.logging
    //         : [],
    //   errorFormat: config.errorFormat || 'colorless',
    //   transactionOptions: config.transactionOptions,
    // })
    throw new Error('Template method - implement Prisma client instantiation in your application')
  }

  /**
   * Get Prisma client instance
   */
  getClient(): PrismaClient {
    // Template implementation - return placeholder
    throw new Error('Template method - implement Prisma client instantiation in your application')
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    // Template implementation - actual connection would be done at runtime
    throw new Error('Template method - implement database connection in your application')
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    // Template implementation - actual disconnection would be done at runtime
    throw new Error('Template method - implement database disconnection in your application')
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    // Template implementation - actual health check would be done at runtime
    throw new Error('Template method - implement health check in your application')
  }

  /**
   * Execute raw SQL
   */
  async executeRaw(query: string, ...params: unknown[]): Promise<number> {
    // Template implementation - actual raw execution would be done at runtime
    throw new Error('Template method - implement raw SQL execution in your application')
  }

  /**
   * Query raw SQL
   */
  async queryRaw(query: string, ...params: unknown[]): Promise<unknown[]> {
    // Template implementation - actual raw query would be done at runtime
    throw new Error('Template method - implement raw SQL query in your application')
  }

  /**
   * Run migrations
   */
  async migrate(): Promise<void> {
    // Template implementation - actual migration would be done at runtime
    throw new Error('Template method - implement database migration in your application')
  }

  /**
   * Reset database
   */
  async reset(): Promise<void> {
    // Template implementation - actual reset would be done at runtime
    throw new Error('Template method - implement database reset in your application')
  }

  /**
   * Seed database
   */
  async seed(seedFunction: (client: PrismaClient) => Promise<void>): Promise<void> {
    // Template implementation - actual seeding would be done at runtime
    throw new Error('Template method - implement database seeding in your application')
  }
}

/**
 * Base repository class with common CRUD operations
 */
export abstract class PrismaRepository<T extends Record<string, unknown>> {
  protected client: PrismaClient
  protected model: any // Using any instead of Prisma.ModelDelegate for template compatibility

  constructor(client: PrismaClient, model: any) {
    this.client = client
    this.model = model
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({
      where: { id },
    })
  }

  /**
   * Find unique by field
   */
  async findUnique(
    where: Record<string, unknown>,
    include?: Record<string, unknown>
  ): Promise<T | null> {
    return await this.model.findUnique({
      where,
      include,
    })
  }

  /**
   * Find first matching record
   */
  async findFirst(
    where?: Record<string, unknown>,
    include?: Record<string, unknown>,
    orderBy?: Record<string, unknown>
  ): Promise<T | null> {
    return await this.model.findFirst({
      where,
      include,
      orderBy,
    })
  }

  /**
   * Find many records
   */
  async findMany(
    options: {
      where?: Record<string, unknown>
      include?: Record<string, unknown>
      orderBy?: Record<string, unknown>
      skip?: number
      take?: number
      cursor?: Record<string, unknown>
    } = {}
  ): Promise<T[]> {
    return await this.model.findMany(options)
  }

  /**
   * Create new record
   */
  async create(data: Record<string, unknown>, include?: Record<string, unknown>): Promise<T> {
    return await this.model.create({
      data,
      include,
    })
  }

  /**
   * Create many records
   */
  async createMany(
    data: Record<string, unknown>[],
    skipDuplicates = false
  ): Promise<{ count: number }> {
    return await this.model.createMany({
      data,
      skipDuplicates,
    })
  }

  /**
   * Update record
   */
  async update(
    where: Record<string, unknown>,
    data: Record<string, unknown>,
    include?: Record<string, unknown>
  ): Promise<T> {
    return await this.model.update({
      where,
      data,
      include,
    })
  }

  /**
   * Update many records
   */
  async updateMany(
    where: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<{ count: number }> {
    return await this.model.updateMany({
      where,
      data,
    })
  }

  /**
   * Upsert record
   */
  async upsert(
    where: Record<string, unknown>,
    create: Record<string, unknown>,
    update: Record<string, unknown>,
    include?: Record<string, unknown>
  ): Promise<T> {
    return await this.model.upsert({
      where,
      create,
      update,
      include,
    })
  }

  /**
   * Delete record
   */
  async delete(where: Record<string, unknown>, include?: Record<string, unknown>): Promise<T> {
    return await this.model.delete({
      where,
      include,
    })
  }

  /**
   * Delete many records
   */
  async deleteMany(where?: Record<string, unknown>): Promise<{ count: number }> {
    return await this.model.deleteMany({
      where,
    })
  }

  /**
   * Count records
   */
  async count(where?: Record<string, unknown>): Promise<number> {
    return await this.model.count({
      where,
    })
  }

  /**
   * Aggregate data
   */
  async aggregate(options: {
    where?: Record<string, unknown>
    _count?: Record<string, unknown>
    _sum?: Record<string, unknown>
    _avg?: Record<string, unknown>
    _min?: Record<string, unknown>
    _max?: Record<string, unknown>
  }): Promise<Record<string, unknown>> {
    return await this.model.aggregate(options)
  }

  /**
   * Group by fields
   */
  async groupBy(options: {
    by: string[]
    where?: Record<string, unknown>
    having?: Record<string, unknown>
    _count?: Record<string, unknown>
    _sum?: Record<string, unknown>
    _avg?: Record<string, unknown>
    _min?: Record<string, unknown>
    _max?: Record<string, unknown>
    orderBy?: Record<string, unknown>
    skip?: number
    take?: number
  }): Promise<Record<string, unknown>[]> {
    return await this.model.groupBy(options)
  }
}

/**
 * Pagination helper
 */
export interface PaginationOptions {
  page?: number
  pageSize?: number
  cursor?: string
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
    nextCursor?: string
    prevCursor?: string
  }
}

export namespace PaginationHelper {
  // Namespace for pagination helper functions
}

/**
 * Paginate with offset-based pagination
 */
export async function paginate<T>(
  model: any, // Using any instead of Prisma.ModelDelegate for template compatibility
  options: PaginationOptions & {
    where?: Record<string, unknown>
    include?: Record<string, unknown>
    orderBy?: Record<string, unknown>
  } = {}
): Promise<PaginatedResult<T>> {
  const page = options.page || 1
  const pageSize = options.pageSize || 10
  const skip = (page - 1) * pageSize

  const [data, total] = await Promise.all([
    model.findMany({
      where: options.where,
      include: options.include,
      orderBy: options.orderBy,
      skip,
      take: pageSize,
    }),
    model.count({
      where: options.where,
    }),
  ])

  const totalPages = Math.ceil(total / pageSize)

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

/**
 * Paginate with cursor-based pagination
 */
export async function paginateCursor<T>(
  model: any, // Using any instead of Prisma.ModelDelegate for template compatibility
  options: {
    cursor?: string
    take?: number
    where?: Record<string, unknown>
    include?: Record<string, unknown>
    orderBy?: Record<string, unknown>
  } = {}
): Promise<{
  data: T[]
  nextCursor?: string
  hasNext: boolean
}> {
  const take = options.take || 10
  const cursor = options.cursor

  const data = await model.findMany({
    where: options.where,
    include: options.include,
    orderBy: options.orderBy,
    take: take + 1, // Take one extra to check if there's a next page
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor
    }),
  })

  const hasNext = data.length > take
  if (hasNext) {
    data.pop() // Remove the extra item
  }

  const nextCursor = hasNext && data.length > 0 ? data[data.length - 1].id : undefined

  return {
    data,
    nextCursor,
    hasNext,
  }
}

/**
 * Transaction helper
 */
export async function withTransaction<T>(
  client: PrismaClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number
    timeout?: number
    isolationLevel?: Prisma.TransactionIsolationLevel
  }
): Promise<T> {
  return await client.$transaction(callback, options)
}

/**
 * Prisma middleware for Hono
 */
export function createPrismaMiddleware(prismaManager: PrismaManager) {
  return async (c: Context, next: () => Promise<void>) => {
    c.set('prisma', prismaManager.getClient())
    c.set('db', prismaManager.getClient()) // Alias for convenience

    try {
      await next()
    } finally {
      // Cleanup if needed
    }
  }
}

/**
 * Database seeder utility
 */
export class DatabaseSeeder {
  private client: PrismaClient

  constructor(client: PrismaClient) {
    this.client = client
  }

  /**
   * Run all seeders
   */
  async run(): Promise<void> {
    console.log('Starting database seeding...')

    try {
      await this.seedUsers()
      await this.seedPosts()

      console.log('Database seeding completed successfully')
    } catch (error) {
      console.error('Database seeding failed:', error)
      throw error
    }
  }

  /**
   * Seed users
   */
  private async seedUsers(): Promise<void> {
    const users = [
      {
        email: 'admin@example.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        emailVerified: true,
        roles: ['admin'],
      },
      {
        email: 'user@example.com',
        username: 'user',
        firstName: 'Regular',
        lastName: 'User',
        emailVerified: true,
        roles: ['user'],
      },
    ]

    for (const userData of users) {
      await this.client.user.upsert({
        where: { email: userData.email },
        create: userData,
        update: userData,
      })
    }

    console.log('Users seeded')
  }

  /**
   * Seed posts
   */
  private async seedPosts(): Promise<void> {
    const admin = await this.client.user.findUnique({
      where: { email: 'admin@example.com' },
    })

    if (!admin) return

    const posts = [
      {
        title: 'Welcome to the API',
        slug: 'welcome-to-the-api',
        content: 'This is a sample post created during database seeding.',
        excerpt: 'A sample post for testing purposes.',
        authorId: admin.id,
        status: 'PUBLISHED' as const,
        tags: ['welcome', 'api'],
        publishedAt: new Date(),
      },
    ]

    for (const postData of posts) {
      await this.client.post.upsert({
        where: { slug: postData.slug },
        create: postData,
        update: postData,
      })
    }

    console.log('Posts seeded')
  }
}

/**
 * Factory function to create Prisma manager
 */
export function createPrismaManager(config: PrismaConfig): PrismaManager {
  return new PrismaManager(config)
}

// Export Prisma types for convenience
// export type { Prisma, PrismaClient } - Commented out to avoid module import errors in template

export default PrismaManager
