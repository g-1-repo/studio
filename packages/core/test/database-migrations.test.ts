import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'

describe('database migrations', () => {
  it('users table exists and has correct structure', async () => {
    const db = env.DB as D1Database
    expect(db).toBeDefined()

    // Check if users table exists
    const result = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).first<{ name: string }>()

    expect(result).toBeDefined()
    expect(result?.name).toBe('users')
  })

  it('sessions table exists and has correct structure', async () => {
    const db = env.DB as D1Database

    // Check if sessions table exists
    const result = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='sessions'
    `).first<{ name: string }>()

    expect(result).toBeDefined()
    expect(result?.name).toBe('sessions')
  })

  it('early_access_request_table exists', async () => {
    const db = env.DB as D1Database

    // Check if early_access_request_table exists
    const result = await db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='early_access_request_table'
    `).first<{ name: string }>()

    expect(result).toBeDefined()
    expect(result?.name).toBe('early_access_request_table')
  })

  it('users table has required columns', async () => {
    const db = env.DB as D1Database

    // Check table schema
    const columns = await db.prepare(`
      PRAGMA table_info(users)
    `).all<{ name: string, type: string, notnull: number, pk: number }>()

    const columnNames = columns.results?.map(col => col.name) || []

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('name')
    expect(columnNames).toContain('email')
    expect(columnNames).toContain('email_verified')
    expect(columnNames).toContain('created_at')
    expect(columnNames).toContain('updated_at')
    expect(columnNames).toContain('role')
  })

  it('sessions table has required columns', async () => {
    const db = env.DB as D1Database

    // Check table schema
    const columns = await db.prepare(`
      PRAGMA table_info(sessions)
    `).all<{ name: string, type: string, notnull: number, pk: number }>()

    const columnNames = columns.results?.map(col => col.name) || []

    expect(columnNames).toContain('id')
    expect(columnNames).toContain('user_id')
    expect(columnNames).toContain('token')
    expect(columnNames).toContain('expires_at')
    expect(columnNames).toContain('created_at')
    expect(columnNames).toContain('updated_at')
  })

  it('foreign key constraints are enabled', async () => {
    const db = env.DB as D1Database

    // Check if foreign keys are enabled
    const result = await db.prepare(`
      PRAGMA foreign_keys
    `).first<{ foreign_keys: number }>()

    expect(result?.foreign_keys).toBe(1)
  })

  it('unique indexes exist for critical fields', async () => {
    const db = env.DB as D1Database

    // Check unique indexes
    const indexes = await db.prepare(`
      SELECT name, tbl_name, sql FROM sqlite_master 
      WHERE type='index' AND sql LIKE '%UNIQUE%'
    `).all<{ name: string, tbl_name: string, sql: string }>()

    const indexNames = indexes.results?.map(idx => idx.name) || []

    // Should have unique index on users.email
    expect(indexNames.some(name => name.includes('email') && name.includes('unique'))).toBe(true)

    // Should have unique index on sessions.token
    expect(indexNames.some(name => name.includes('token') && name.includes('unique'))).toBe(true)
  })
})
