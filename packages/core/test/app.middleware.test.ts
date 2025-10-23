import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies } from './utils'

describe('app middleware integration', () => {
  it('rejects disallowed content-type with 415', async () => {
    // POST to any route with disallowed content type should be blocked by requestValidation
    const res = await requestWithCookies(app, '/early-access-requests', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'hello',
    })
    expect(res.status).toBe(415)
    const body = await res.json<any>()
    expect(body.error).toMatch(/Invalid content type/i)
  })

  it('preflight OPTIONS succeeds', async () => {
    const res = await requestWithCookies(app, '/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    })
    // hono/cors typically returns 204
    expect([200, 204]).toContain(res.status)
    expect(res.headers.get('access-control-allow-methods')).toContain('GET')
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy()
    expect(res.headers.get('access-control-allow-credentials')).toMatch(/true/i)
    // exposed headers
    const expose = res.headers.get('access-control-expose-headers') || ''
    expect(expose).toMatch(/content-length/i)
  })
})
