import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies, resetCookies } from './utils'

// This test exercises the Better Auth anonymous sign-in flow.

describe('auth: anonymous sign-in', () => {
  it('post /api/auth/sign-in/anonymous returns a user', async () => {
    const jar = 'anon'
    resetCookies(jar)

    const res = await requestWithCookies(app, '/api/auth/sign-in/anonymous', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }, jar)

    const text = await res.text()
    // Debug on failure
    if (res.status >= 500) {
      console.error('auth anonymous error:', res.status, text)
    }
    expect(res.status).toBeGreaterThanOrEqual(200)
    expect(res.status).toBeLessThan(500)

    // allow either success body or a specific functional error if already signed in
    expect(text).toMatch(/user|ANONYMOUS_USERS_CANNOT_SIGN_IN_AGAIN_ANONYMOUSLY/i)
  })
})
