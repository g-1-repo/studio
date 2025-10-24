import type { Environment } from '../env'

// import { env } from "cloudflare:workers";
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema'

export function createDb(env: Environment): any {
  if (!env.DB) {
    throw new Error('Database binding (DB) is not available in environment')
  }

  const db = drizzle(env.DB, {
    casing: 'snake_case',
    schema,
  })
  return db
}

export * from './auth.schema'
// Export all database utilities
export * from './schema'
export * from './tables'
