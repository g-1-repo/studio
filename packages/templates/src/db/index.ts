import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'

export function createDb(database: unknown) {
  return drizzle(database as unknown as object, {
    schema: schema as Record<string, unknown>,
    casing: 'snake_case',
  })
}

export * as auth from './auth.schema'
// Database templates
export * as drizzleTemplate from './drizzle.template'
export * as schema from './schema'
export * as tables from './tables'
