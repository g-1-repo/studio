import type { Mailer, SendProps } from './interfaces/mailer.interface'
import process from 'node:process'

import { createWorkerSafeCuid2 as createId } from '@g-1/util'

import { Resend } from 'resend'

export interface MailerConfig {
  fromEmail?: string
  fromName?: string
  replyTo?: string
  resendApiKey?: string
}

export class MailerService implements Mailer {
  private readonly config: Required<MailerConfig>
  private readonly useMock: boolean

  constructor(
    private resend?: Resend,
    config: MailerConfig = {},
  ) {
    this.config = {
      fromEmail: config.fromEmail ?? 'no_reply@onboarding.golive.me',
      fromName: config.fromName ?? 'Golive',
      replyTo: config.replyTo ?? 'support@golive.me',

      resendApiKey: config.resendApiKey ?? process.env.RESEND_API_KEY ?? '',
    }

    this.useMock = (process.env.NODE_ENV === 'test')

    if (!this.useMock && !this.resend) {
      if (!this.config.resendApiKey) {
        throw new Error('Resend API key is required')
      }
      this.resend = new Resend(this.config.resendApiKey)
    }
  }

  async send(data: SendProps): Promise<{ id: string }> {
    const subject = data.template.subject()
    const html = data.template.html()

    // Test-only: capture email instead of sending
    if (this.useMock) {
      const { recordEmail } = await import('./testing/test-mailbox')
      recordEmail({
        to: data.to,
        subject,
        html,
        headers: { 'X-Entity-Ref-ID': createId() },
      })
      return { id: `test_${createId()}` }
    }

    try {
      const result = await this.resend!.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [data.to],
        replyTo: this.config.replyTo,
        subject,
        html,
        headers: {
          'X-Entity-Ref-ID': createId(),
        },
      })

      if (result.error) {
        throw new Error(`Failed to send email: ${result.error.message}`)
      }

      return { id: result.data?.id ?? 'unknown' }
    }
    catch (error) {
      console.error('Failed to send email:', error)
      throw new Error(
        `Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
