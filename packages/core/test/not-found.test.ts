import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies } from './utils'

describe('not found handler', () => {
  it('unknown route returns error json', async () => {
    const res = await requestWithCookies(app, '/__does-not-exist__', { method: 'GET' })
    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.json<any>()
    if (res.status === 404) {
      expect(body.message).toMatch(/Not Found/i)
    }
    else {
      // should still return structured error
      expect(typeof body.message).toBe('string')
    }
  })
})
