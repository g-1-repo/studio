import type { Environment } from '@/env'

// import { env } from "cloudflare:workers";
import { drizzle } from 'drizzle-orm/d1'

import * as schema from './schema'

export function createDb(env: Environment) {
  const db = drizzle(env.DB, {
    casing: 'snake_case',
    schema,
  })
  return { db }
}
