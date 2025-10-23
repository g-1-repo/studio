import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies } from './utils'

describe('aPI documentation', () => {
  it('openAPI spec is accessible at /doc', async () => {
    const res = await requestWithCookies(app, '/doc', { method: 'GET' })
    expect(res.status).toBe(200)

    const json = await res.json<any>()
    expect(json.openapi).toBeDefined()
    expect(json.info).toBeDefined()
    expect(json.info.title).toBe('G1 Api Boilerplate')
    expect(json.info.version).toBeDefined()
  })

  it('aPI reference documentation is accessible at /reference', async () => {
    const res = await requestWithCookies(app, '/reference', { method: 'GET' })
    expect(res.status).toBe(200)

    const text = await res.text()
    expect(text).toContain('API Reference')
    expect(text).toContain('scalar') // Should contain Scalar references
  })

  it('openAPI spec includes paths for v1 routes', async () => {
    const res = await requestWithCookies(app, '/doc', { method: 'GET' })
    const json = await res.json<any>()

    expect(json.paths).toBeDefined()
    expect(Object.keys(json.paths)).toContain('/v1/early-access-requests')
  })

  it('openAPI spec has proper structure', async () => {
    const res = await requestWithCookies(app, '/doc', { method: 'GET' })
    const json = await res.json<any>()

    // Validate OpenAPI 3.1.1 structure
    expect(json.openapi).toBe('3.1.1')
    expect(json.info).toHaveProperty('version')
    expect(json.info).toHaveProperty('title')
    expect(json.paths).toBeDefined()
  })
})
