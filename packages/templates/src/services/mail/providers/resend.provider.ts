import type { EmailData, EmailProvider } from './email-provider.interface'
import { Resend } from 'resend'

export class ResendProvider implements EmailProvider {
  private resend: Resend

  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error('Resend API key is required')
    }
    this.resend = new Resend(apiKey)
  }

  validateConfig(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0)
  }

  async send(email: EmailData): Promise<{ id: string }> {
    try {
      const result = await this.resend.emails.send({
        from: email.from,
        to: [email.to],
        replyTo: email.replyTo,
        subject: email.subject,
        html: email.html,
        headers: email.headers,
      })

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`)
      }

      return { id: result.data?.id ?? 'unknown' }
    }
    catch (error) {
      console.error('ResendProvider send failed:', error)
      throw new Error(
        `Email sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}
