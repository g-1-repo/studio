import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies } from './utils'

describe('request validation', () => {
  it('rejects oversized request bodies with 413', async () => {
    const largeBody = 'x'.repeat(3 * 1024 * 1024) // 3MB (over 2MB limit)

    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': largeBody.length.toString(),
      },
      body: JSON.stringify({ email: 'test@example.com', data: largeBody }),
    })

    expect(res.status).toBe(413)
    const body = await res.json<any>()
    expect(body.error).toMatch(/Request entity too large/i)
    expect(body.maxSize).toBe(2 * 1024 * 1024) // 2MB
  })

  it('rejects disallowed content types with 415', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'plain text body',
    })

    expect(res.status).toBe(415)
    const body = await res.json<any>()
    expect(body.error).toMatch(/Invalid content type/i)
    expect(body.allowedTypes).toContain('application/json')
  })

  it('accepts valid JSON requests', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: `validation+${Date.now()}@example.com` }),
    })

    expect(res.status).toBeLessThan(400) // Should not be a client error
  })

  it('accepts multipart form data', async () => {
    // Test with a simple form data structure
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
    const formData = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="email"',
      '',
      `multipart+${Date.now()}@example.com`,
      `--${boundary}--`,
    ].join('\r\n')

    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
        'content-length': formData.length.toString(),
      },
      body: formData,
    })

    // Should not reject due to content type (though may fail validation later)
    expect(res.status).not.toBe(415)
  })

  it('accepts URL encoded form data', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `email=urlencoded%2B${Date.now()}%40example.com`,
    })

    // Should not reject due to content type (though may fail validation later)
    expect(res.status).not.toBe(415)
  })

  it('handles missing content type gracefully for POST requests', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      // No content-type header
      body: JSON.stringify({ email: `nocontenttype+${Date.now()}@example.com` }),
    })

    // Should not require content type by default (requireContentType: false)
    expect(res.status).not.toBe(400)
  })

  it('rejects malformed JSON with proper error', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email": "test@example.com", invalid json}',
    })

    expect(res.status).toBeGreaterThanOrEqual(400)
    // The error should be handled by the JSON parsing middleware
  })

  it('validates early access request email format', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email-format' }),
    })

    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.json<any>()
    expect(body.error || body.message).toBeDefined()
  })

  it('validates required fields for early access requests', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}), // Missing email field
    })

    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.json<any>()
    expect(body.error || body.message).toBeDefined()
  })
})
