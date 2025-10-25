import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function createDb(database: D1Database) {
  return drizzle(database, {
    schema,
    casing: 'snake_case'
  })
}

export * as auth from './auth.schema'
export * as schema from './schema'
export * as tables from './tables'

// Database templates
export * as drizzleTemplate from './drizzle.template'
export * as prismaTemplate from './prisma.template'
export * as kyselyTemplate from './kysely.template'
