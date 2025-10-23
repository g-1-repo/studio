import { describe, expect, it } from 'vitest'
import app from '@/app'
import { requestWithCookies } from './utils'

describe('security headers', () => {
  it('includes X-Content-Type-Options header', async () => {
    // Test on API endpoint where security headers are applied
    const res = await requestWithCookies(app, '/v1/early-access-requests', { method: 'GET' })
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })

  it('includes X-Frame-Options header', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', { method: 'GET' })
    expect(res.headers.get('x-frame-options')).toBe('DENY')
  })

  it('includes X-XSS-Protection header', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', { method: 'GET' })
    expect(res.headers.get('x-xss-protection')).toBe('1; mode=block')
  })

  it('includes Referrer-Policy header', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', { method: 'GET' })
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })

  it('includes Permissions-Policy header', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', { method: 'GET' })
    const permissionsPolicy = res.headers.get('permissions-policy')

    expect(permissionsPolicy).toBeTruthy()
    expect(permissionsPolicy).toContain('camera=()')
    expect(permissionsPolicy).toContain('microphone=()')
    expect(permissionsPolicy).toContain('geolocation=()')
    expect(permissionsPolicy).toContain('payment=()')
  })

  it('includes Content-Security-Policy for HTML content', async () => {
    const res = await requestWithCookies(app, '/', { method: 'GET' })
    const csp = res.headers.get('content-security-policy')

    expect(csp).toBeTruthy()
    expect(csp).toContain('default-src')
    expect(csp).toContain('script-src')
    expect(csp).toContain('style-src')
    expect(csp).toContain('frame-ancestors \'none\'')
    expect(csp).toContain('base-uri \'none\'')
  })

  it('includes CSP for API reference documentation', async () => {
    const res = await requestWithCookies(app, '/reference', { method: 'GET' })
    const csp = res.headers.get('content-security-policy')

    expect(csp).toBeTruthy()
    // Should allow external resources needed for Scalar
    expect(csp).toContain('unpkg.com')
    expect(csp).toContain('cdn.jsdelivr.net')
  })

  it('applies security headers to API endpoints', async () => {
    const res = await requestWithCookies(app, '/v1/early-access-requests', {
      method: 'GET',
    })

    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('x-xss-protection')).toBe('1; mode=block')
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })

  it('applies security headers to auth endpoints', async () => {
    const res = await requestWithCookies(app, '/api/auth/sign-in/anonymous', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('x-xss-protection')).toBe('1; mode=block')
    expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  })

  it('applies security headers to error responses', async () => {
    const res = await requestWithCookies(app, '/__does-not-exist__', {
      method: 'GET',
    })

    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('x-frame-options')).toBe('DENY')
    expect(res.headers.get('x-xss-protection')).toBe('1; mode=block')
  })

  it('includes CORS headers with security considerations', async () => {
    const res = await requestWithCookies(app, '/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET',
      },
    })

    expect(res.headers.get('access-control-allow-credentials')).toMatch(/true/i)
    expect(res.headers.get('access-control-allow-origin')).toBeTruthy()
    expect(res.headers.get('access-control-expose-headers')).toContain('Content-Length')
  })

  it('does not expose sensitive server information', async () => {
    const res = await requestWithCookies(app, '/health', { method: 'GET' })

    // Should not expose server version or other sensitive info
    expect(res.headers.get('server')).toBeNull()
    expect(res.headers.get('x-powered-by')).toBeNull()
  })
})
