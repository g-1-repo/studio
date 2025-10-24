import type { EmailTemplate } from './email-template.interface'

export interface SendProps {
  to: string
  template: EmailTemplate
}

export interface Mailer {
  send: (data: SendProps) => Promise<{ id: string }>
}
