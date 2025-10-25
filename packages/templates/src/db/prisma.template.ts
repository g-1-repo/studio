import { PrismaClient, Prisma } from '@prisma/client'
import type { Context } from 'hono'

export type DatabaseProvider = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'mongodb' | 'cockroachdb'

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
`
}

/**
 * Prisma Client Manager
 */
export class PrismaManager {
  private client: PrismaClient
  private config: PrismaConfig

  constructor(config: PrismaConfig) {
    this.config = config
    this.client = new PrismaClient({
      datasources: {
        db: {
          url: config.url
        }
      },
      log: config.logging === true ? ['query', 'info', 'warn', 'error'] : 
           Array.isArray(config.logging) ? config.logging : [],
      errorFormat: config.errorFormat || 'colorless',
      transactionOptions: config.transactionOptions
    })
  }

  /**
   * Get Prisma client instance
   */
  getClient(): PrismaClient {
    return this.client
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    await this.client.$connect()
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    await this.client.$disconnect()
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Prisma health check failed:', error)
      return false
    }
  }

  /**
   * Execute raw query
   */
  async executeRaw(query: string, ...params: any[]): Promise<any> {
    return await this.client.$executeRawUnsafe(query, ...params)
  }

  /**
   * Query raw
   */
  async queryRaw(query: string, ...params: any[]): Promise<any> {
    return await this.client.$queryRawUnsafe(query, ...params)
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<void> {
    // Note: Migrations should typically be run via Prisma CLI
    // This is for programmatic migration in development
    console.log('Run migrations using: npx prisma migrate dev')
  }

  /**
   * Reset database (development only)
   */
  async reset(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database reset is not allowed in production')
    }
    
    console.log('Run database reset using: npx prisma migrate reset')
  }

  /**
   * Seed database
   */
  async seed(seedFunction: (client: PrismaClient) => Promise<void>): Promise<void> {
    await seedFunction(this.client)
  }
}

/**
 * Base repository class with common CRUD operations
 */
export abstract class PrismaRepository<T extends Record<string, any>> {
  protected client: PrismaClient
  protected model: any

  constructor(client: PrismaClient, model: any) {
    this.client = client
    this.model = model
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    return await this.model.findUnique({
      where: { id }
    })
  }

  /**
   * Find unique by field
   */
  async findUnique(where: any, include?: any): Promise<T | null> {
    return await this.model.findUnique({
      where,
      include
    })
  }

  /**
   * Find first matching record
   */
  async findFirst(where?: any, include?: any, orderBy?: any): Promise<T | null> {
    return await this.model.findFirst({
      where,
      include,
      orderBy
    })
  }

  /**
   * Find many records
   */
  async findMany(options: {
    where?: any
    include?: any
    orderBy?: any
    skip?: number
    take?: number
    cursor?: any
  } = {}): Promise<T[]> {
    return await this.model.findMany(options)
  }

  /**
   * Create new record
   */
  async create(data: any, include?: any): Promise<T> {
    return await this.model.create({
      data,
      include
    })
  }

  /**
   * Create many records
   */
  async createMany(data: any[], skipDuplicates = false): Promise<{ count: number }> {
    return await this.model.createMany({
      data,
      skipDuplicates
    })
  }

  /**
   * Update record
   */
  async update(where: any, data: any, include?: any): Promise<T> {
    return await this.model.update({
      where,
      data,
      include
    })
  }

  /**
   * Update many records
   */
  async updateMany(where: any, data: any): Promise<{ count: number }> {
    return await this.model.updateMany({
      where,
      data
    })
  }

  /**
   * Upsert record
   */
  async upsert(where: any, create: any, update: any, include?: any): Promise<T> {
    return await this.model.upsert({
      where,
      create,
      update,
      include
    })
  }

  /**
   * Delete record
   */
  async delete(where: any, include?: any): Promise<T> {
    return await this.model.delete({
      where,
      include
    })
  }

  /**
   * Delete many records
   */
  async deleteMany(where?: any): Promise<{ count: number }> {
    return await this.model.deleteMany({
      where
    })
  }

  /**
   * Count records
   */
  async count(where?: any): Promise<number> {
    return await this.model.count({
      where
    })
  }

  /**
   * Aggregate data
   */
  async aggregate(options: {
    where?: any
    _count?: any
    _sum?: any
    _avg?: any
    _min?: any
    _max?: any
  }): Promise<any> {
    return await this.model.aggregate(options)
  }

  /**
   * Group by
   */
  async groupBy(options: {
    by: string[]
    where?: any
    having?: any
    _count?: any
    _sum?: any
    _avg?: any
    _min?: any
    _max?: any
    orderBy?: any
    skip?: number
    take?: number
  }): Promise<any[]> {
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

export class PaginationHelper {
  /**
   * Paginate with offset-based pagination
   */
  static async paginate<T>(
    model: any,
    options: PaginationOptions & {
      where?: any
      include?: any
      orderBy?: any
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
        take: pageSize
      }),
      model.count({
        where: options.where
      })
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
        hasPrev: page > 1
      }
    }
  }

  /**
   * Paginate with cursor-based pagination
   */
  static async paginateCursor<T>(
    model: any,
    options: {
      cursor?: string
      take?: number
      where?: any
      include?: any
      orderBy?: any
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
        skip: 1 // Skip the cursor
      })
    })

    const hasNext = data.length > take
    if (hasNext) {
      data.pop() // Remove the extra item
    }

    const nextCursor = hasNext && data.length > 0 ? data[data.length - 1].id : undefined

    return {
      data,
      nextCursor,
      hasNext
    }
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
        roles: ['admin']
      },
      {
        email: 'user@example.com',
        username: 'user',
        firstName: 'Regular',
        lastName: 'User',
        emailVerified: true,
        roles: ['user']
      }
    ]

    for (const userData of users) {
      await this.client.user.upsert({
        where: { email: userData.email },
        create: userData,
        update: userData
      })
    }

    console.log('Users seeded')
  }

  /**
   * Seed posts
   */
  private async seedPosts(): Promise<void> {
    const admin = await this.client.user.findUnique({
      where: { email: 'admin@example.com' }
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
        publishedAt: new Date()
      }
    ]

    for (const postData of posts) {
      await this.client.post.upsert({
        where: { slug: postData.slug },
        create: postData,
        update: postData
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
export type { PrismaClient, Prisma }

export default PrismaManager