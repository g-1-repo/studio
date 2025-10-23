import { describe, expect, it } from 'vitest'
import { createRouter, createTestApp } from '@/lib/create-app'
import { requirePermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/shared'
import { requestWithCookies, resetCookies } from './utils'

const router = createRouter()
  .get('/__test__/perm', requirePermission(PERMISSIONS.USER_READ), c => c.json({ ok: true }))

const testApp = createTestApp(router as any)

describe('permissions middleware', () => {
  it('401 when not authenticated', async () => {
    const jar = 'perm'
    resetCookies(jar)
    const res = await requestWithCookies(testApp as any, '/__test__/perm', { method: 'GET' }, jar)
    expect(res.status).toBe(401)
  })

  it('200 after anonymous sign-in (USER role has USER_READ)', async () => {
    const jar = 'perm'
    const sign = await requestWithCookies(testApp as any, '/api/auth/sign-in/anonymous', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }, jar)
    expect(sign.status).toBeLessThan(500)

    const res = await requestWithCookies(testApp as any, '/__test__/perm', { method: 'GET' }, jar)
    expect(res.status).toBe(200)
  })
})
