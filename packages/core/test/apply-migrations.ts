import { env } from 'cloudflare:test'
import { beforeAll } from 'vitest'

// Applies D1 migrations (if any were discovered by vitest.config.ts)
beforeAll(async () => {
  const g = globalThis as any
  if (g.__MIGRATIONS_APPLIED__)
    return
  // TEST_MIGRATIONS is injected via vitest.config.ts -> miniflare.bindings
  const migrations = (env as any).TEST_MIGRATIONS as unknown
  const db = (env as any).DB as D1Database | undefined

  if (!db || !migrations)
    return

  const raw: string[] = Array.isArray(migrations) ? (migrations as string[]) : []
  // Strip comment-only statements and normalize
  const stmts = raw
    .map(s => s
      .split('\n')
      .filter(line => !/^\s*--/.test(line))
      .join('\n')
      .trim(),
    )
    .filter(Boolean)

  // Run critical tables first
  const first = stmts.filter(s => /CREATE\s+TABLE\s+[`"]?users[`"]?/i.test(s))
  const rest = stmts.filter(s => !/CREATE\s+TABLE\s+[`"]?users[`"]?/i.test(s))

  await db.exec('PRAGMA foreign_keys=OFF')
  for (const s of [...first, ...rest]) {
    try {
      const stmt = s.replace(/`/g, '"')
      await db.prepare(stmt).run()
    }
    catch (e) {
      console.error('Migration exec error:', (e as Error).message, '\nSQL:', s.slice(0, 1000))
      throw e
    }
  }
  await db.exec('PRAGMA foreign_keys=ON')

  try {
    const r = await db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'users\'').first<any>()
    if (!r) {
      // Fallback: create minimal auth tables required for tests
      await db.exec(`CREATE TABLE IF NOT EXISTS "users" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL,
        "email_verified" integer NOT NULL,
        "image" text,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "role" text DEFAULT 'user' NOT NULL,
        "banned" integer,
        "ban_reason" text,
        "ban_expires" integer,
        "is_anonymous" integer,
        "username" text,
        "display_username" text
      );`)
      await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_unique" ON "users" ("email");`)
      await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique" ON "users" ("username");`)
      await db.exec(`CREATE TABLE IF NOT EXISTS "sessions" (
        "id" text PRIMARY KEY NOT NULL,
        "expires_at" integer NOT NULL,
        "token" text NOT NULL,
        "created_at" integer NOT NULL,
        "updated_at" integer NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "user_id" text NOT NULL,
        "timezone" text,
        "city" text,
        "country" text,
        "region" text,
        "region_code" text,
        "colo" text,
        "latitude" text,
        "longitude" text,
        "impersonated_by" text,
        "active_organization_id" text,
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
      );`)
      await db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_unique" ON "sessions" ("token");`)

      console.info('Fallback auth tables created')
    }
  }
  catch {}

  g.__MIGRATIONS_APPLIED__ = true
})
