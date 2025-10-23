import { env } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { EarlyAccessRequestsRepository } from '@/routes/v1/early-access-requests/early-access-requests.repository'

const repo = new EarlyAccessRequestsRepository()

function uniqueEmail() {
  return `repo+${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`
}

describe('early-access-requests-repository', () => {
  it('create, find, delete', async () => {
    const email = uniqueEmail()
    const created = await repo.create({ email }, env as any)
    expect(created.email).toBe(email)
    const found = await repo.findOneByEmail(email, env as any)
    expect(found?.email).toBe(email)
    const del = await repo.remove(created.id, env as any)
    expect(del.meta.changes).toBe(1)
    const missing = await repo.findOneByEmail(email, env as any)
    expect(missing).toBeNull()
  })
})
