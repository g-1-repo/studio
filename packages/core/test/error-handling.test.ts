import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies } from './utils'

describe('error handling', () => {
  it('returns json error on thrown exception', async () => {
    const res = await requestWithCookies(app, '/__test__/throw', { method: 'GET' })
    expect(res.status).toBe(500)
    const body = await res.json<any>()

    // Check for new structured error format
    expect(body.error).toBeDefined()
    expect(body.error.code).toBe('UNKNOWN_ERROR')
    expect(body.error.message).toMatch(/boom/i)
    expect(body.error.timestamp).toBeDefined()

    // Stack trace is handled by console.error in our error handler, not in response
    // This is intentional for security in production
  })
})
