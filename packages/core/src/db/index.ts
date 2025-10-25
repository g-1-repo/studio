/**
 * Database connection factory for Drizzle ORM with Cloudflare D1
 */

import { drizzle } from 'drizzle-orm/d1'
import type { Environment } from '../env.js'

export interface DatabaseConfig {
  database: any
}

export function createDb(env: Environment) {
  if (!env.DB) {
    throw new Error('Database binding (DB) is not available in environment')
  }

  return drizzle(env.DB)
}

// Database utilities
export const db = {
  // Connection helper
  connect: (env: Environment) => createDb(env),

  // Health check
  healthCheck: async (database: any) => {
    try {
      await database.prepare('SELECT 1').first()
      return true
    } catch {
      return false
    }
  },
}
