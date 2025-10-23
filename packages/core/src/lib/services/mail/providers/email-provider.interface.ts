export interface EmailData {
  to: string
  from: string
  replyTo?: string
  subject: string
  html: string
  headers?: Record<string, string>
}

export interface EmailProvider {
  send: (email: EmailData) => Promise<{ id: string }>
  validateConfig: () => boolean
}

export interface EmailProviderConfig {
  type: 'resend' | 'mock'
  apiKey?: string
  fromEmail?: string
  fromName?: string
  replyTo?: string
}
