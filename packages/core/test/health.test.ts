import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies } from './utils'

describe('health endpoint', () => {
  it('get /health returns status ok', async () => {
    const res = await requestWithCookies(app, '/health', { method: 'GET' })
    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.status).toBe('ok')
    expect(typeof body.timestamp).toBe('string')
  })
})
