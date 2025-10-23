import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '@/app'
import { clearOutbox, postJSON, requestJSON, requestWithCookies, uniqueEmail } from './utils'

const TEST_EMAIL = uniqueEmail('earlysuite')
let createdId: string | null = null

describe('early-access-requests routes', () => {
  beforeAll(async () => {
    await clearOutbox(app)
  })

  afterAll(async () => {
    // Try to cleanup if created
    if (createdId) {
      await requestWithCookies(app, `/v1/early-access-requests/${createdId}`, { method: 'DELETE' })
    }
  })

  it('creates an early access request (201/200)', async () => {
    const { json } = await postJSON(app, '/v1/early-access-requests', { email: TEST_EMAIL }, [200, 201])
    expect(json.email).toBe(TEST_EMAIL)
    expect(json.id).toBeDefined()
    createdId = json.id
  })

  it('returns conflict when creating the same email again (409)', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL }),
    })
    expect(res.status).toBe(409)
    const body = await res.json<any>()
    // Check for new structured error format
    const errorMessage = body.error?.message || body.message || ''
    expect(errorMessage).toMatch(/already been made/i)
  })

  it('lists early access requests (GET)', async () => {
    const { json } = await requestJSON(app, '/v1/early-access-requests', { method: 'GET' }, 200)
    expect(Array.isArray(json)).toBe(true)
    expect(json.some((i: any) => i.email === TEST_EMAIL)).toBe(true)
  })

  it('deletes by id and returns 204, then 404 on second delete', async () => {
    if (!createdId)
      return
    const del1 = await requestWithCookies(app, `/v1/early-access-requests/${createdId}`, { method: 'DELETE' })
    expect(del1.status).toBe(204)

    const del2 = await requestWithCookies(app, `/v1/early-access-requests/${createdId}`, { method: 'DELETE' })
    expect(del2.status).toBe(404)
  })
})
