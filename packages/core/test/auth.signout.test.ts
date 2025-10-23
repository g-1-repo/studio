import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies, resetCookies } from './utils'

describe('auth: sign-out flow', () => {
  it('sets cookie on sign-in and clears on sign-out; protected becomes 401', async () => {
    const jar = 'signout'
    resetCookies(jar)

    const signIn = await requestWithCookies(app, '/api/auth/sign-in/anonymous', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }, jar)
    expect(signIn.status).toBeLessThan(500)
    const setCookieIn = signIn.headers.get('set-cookie') || ''
    expect(setCookieIn.toLowerCase()).toContain('better-auth.session_token')

    const protectedOk = await requestWithCookies(app, '/protected', { method: 'GET' }, jar)
    expect(protectedOk.status).toBe(200)

    const signOut = await requestWithCookies(app, '/api/auth/sign-out', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }, jar)
    expect([200, 204]).toContain(signOut.status)
    const setCookieOut = signOut.headers.get('set-cookie') || ''
    expect(setCookieOut.toLowerCase()).toContain('better-auth.session_token')

    const protectedAfter = await requestWithCookies(app, '/protected', { method: 'GET' }, jar)
    expect(protectedAfter.status).toBe(401)
  })
})
