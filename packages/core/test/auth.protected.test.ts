import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies, resetCookies } from './utils'

describe('protected route access', () => {
  it('401 when not logged in, 200 after anonymous sign-in', async () => {
    const jar = 'protected'
    resetCookies(jar)

    const res1 = await requestWithCookies(app, '/protected', { method: 'GET' }, jar)
    expect(res1.status).toBe(401)

    const sign = await requestWithCookies(app, '/api/auth/sign-in/anonymous', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }, jar)
    expect(sign.status).toBeLessThan(500)

    const res2 = await requestWithCookies(app, '/protected', { method: 'GET' }, jar)
    expect(res2.status).toBe(200)
  })
})
