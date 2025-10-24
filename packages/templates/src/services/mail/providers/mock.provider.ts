import { createWorkerSafeCuid2 as createId } from '@g-1/util'
import { recordEmail } from '../testing/test-mailbox'
import type { EmailData, EmailProvider } from './email-provider.interface'

export class MockProvider implements EmailProvider {
  validateConfig(): boolean {
    return true // Mock provider always validates
  }

  async send(email: EmailData): Promise<{ id: string }> {
    // Record email for testing
    recordEmail({
      to: email.to,
      subject: email.subject,
      html: email.html,
      headers: email.headers,
    })

    // Return mock ID
    return { id: `mock_${createId()}` }
  }
}
