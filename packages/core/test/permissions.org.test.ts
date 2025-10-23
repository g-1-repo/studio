import { createId } from '@paralleldrive/cuid2'
import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { createDb } from '@/db'
import { members, organizations } from '@/db/auth.schema'
import { createRouter, createTestApp } from '@/lib/create-app'
import { requirePermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/shared'
import { requestWithCookies, resetCookies } from './utils'

const router = createRouter()
  .get('/__test__/orgs/:organizationId/resource', requirePermission(PERMISSIONS.ORG_MANAGE), c => c.json({ ok: true }))

const testApp = createTestApp(router as any)

describe('org permissions middleware', () => {
  it('403 when authenticated but not a member; 200 when member with OWNER role (ORG_MANAGE)', async () => {
    // Ensure the first created user (admin) is consumed by a separate session
    const burnJar = 'orgperm_burn'
    resetCookies(burnJar)
    await requestWithCookies(testApp as any, '/api/auth/sign-in/anonymous', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }, burnJar)

    const jar = 'orgperm'
    resetCookies(jar)

    // Sign in anonymously (non-admin user)
    const sign = await requestWithCookies(testApp as any, '/api/auth/sign-in/anonymous', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    }, jar)
    expect(sign.status).toBeLessThan(500)

    // Get current session to obtain userId
    const sessionRes = await requestWithCookies(testApp as any, '/api/auth/get-session', { method: 'GET' }, jar)
    expect(sessionRes.status).toBe(200)
    const sessionJson = await sessionRes.json<any>()
    const userId = sessionJson?.user?.id as string
    expect(typeof userId).toBe('string')

    // Create org without membership -> expect 403
    const orgId = `org_${createId()}`
    const { db } = createDb(env as any)
    await db.insert(organizations).values({ id: orgId, name: 'Test Org', createdAt: new Date() })

    const resForbidden = await requestWithCookies(testApp as any, `/__test__/orgs/${orgId}/resource`, { method: 'GET' }, jar)
    expect(resForbidden.status).toBe(403)

    // Add membership as OWNER -> should have ORG_VIEW implicitly
    await db.insert(members).values({ id: createId(), organizationId: orgId, userId, role: 'owner', createdAt: new Date() })

    const resOk = await requestWithCookies(testApp as any, `/__test__/orgs/${orgId}/resource`, { method: 'GET' }, jar)
    expect(resOk.status).toBe(200)
  })
})
