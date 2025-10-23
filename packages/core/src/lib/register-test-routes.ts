import type { OpenAPIHono } from '@hono/zod-openapi'
import type { AppBindings } from './types'

export function registerTestRoutes(app: OpenAPIHono<AppBindings>) {
  app.get('/__test__/emails', async (c) => {
    const { getEmails } = await import('@/lib/services/mail/testing/test-mailbox')
    return c.json(getEmails())
  })

  app.post('/__test__/emails/clear', async (c) => {
    const { clearEmails } = await import('@/lib/services/mail/testing/test-mailbox')
    clearEmails()
    return c.json({ ok: true })
  })

  app.post('/__test__/emails/send-otp', async (c) => {
    const { createMailService, TEMPLATE_NAMES } = await import('@/lib/services/mail')
    const body = await c.req.json<{ to: string, code: string }>()
    const mailService = createMailService({
      provider: { type: 'mock' },
    })
    await mailService.send({
      to: body.to,
      template: TEMPLATE_NAMES.LOGIN_OTP_VERIFICATION,
      templateArgs: [body.code],
    })
    return c.json({ ok: true })
  })

  app.post('/__test__/emails/send-magic', async (c) => {
    const { createMailService, TEMPLATE_NAMES } = await import('@/lib/services/mail')
    const body = await c.req.json<{ to: string, url: string }>()
    const mailService = createMailService({
      provider: { type: 'mock' },
    })
    await mailService.send({
      to: body.to,
      template: TEMPLATE_NAMES.LOGIN_LINK_VERIFICATION,
      templateArgs: [body.url],
    })
    return c.json({ ok: true })
  })

  // Test-only error route to exercise onError handler
  app.get('/__test__/throw', () => {
    throw new Error('boom')
  })
}
