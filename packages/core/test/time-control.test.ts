import { describe, expect, it, vi } from 'vitest'
import app from '@/app'

describe('time control with fake timers', () => {
  it('health endpoint timestamp reflects mocked time', async () => {
    const fake = new Date('2024-01-23T12:34:56.000Z')
    vi.useFakeTimers()
    vi.setSystemTime(fake)

    const res = await app.request('/health', { method: 'GET' })
    expect(res.status).toBe(200)
    const body = await res.json<any>()
    expect(body.timestamp).toBe(fake.toISOString())

    vi.useRealTimers()
  })
})
