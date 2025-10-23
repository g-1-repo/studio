import { describe, expect, it } from 'vitest'
import app from '@/app'
import { getOutbox, requestWithCookies } from './utils'

describe('test email outbox', () => {
  it('captures OTP emails and exposes the code', async () => {
    const before = await getOutbox(app)

    const to = 'user@example.com'
    const code = '123456'

    const send = await requestWithCookies(app, '/__test__/emails/send-otp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to, code }),
    })
    expect(send.status).toBe(200)

    const emails = await getOutbox(app)
    expect(emails.length).toBeGreaterThan(before.length)
    const last = emails[emails.length - 1]
    expect(last.to).toBe(to)
    expect(last.subject).toMatch(/Email Verification/i)
    expect(last.html).toContain(code)
  })

  it('captures magic-link emails and exposes the link', async () => {
    const before = await getOutbox(app)

    const to = 'user@example.com'
    const url = 'https://example.com/verify?token=abc123'

    const send = await requestWithCookies(app, '/__test__/emails/send-magic', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ to, url }),
    })
    expect(send.status).toBe(200)

    const emails = await getOutbox(app)
    expect(emails.length).toBeGreaterThan(before.length)
    const last = emails[emails.length - 1]
    expect(last.to).toBe(to)
    expect(last.subject).toMatch(/Verify Your Email Address/i)
    expect(last.html).toContain(url)
  })
})
