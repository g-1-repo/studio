import process from 'node:process'
import { createWorkerSafeCuid2 as createId } from '@g-1/core'
import type { EmailTemplate } from '../interfaces/email-template.interface'
import type { EmailProvider, EmailProviderConfig } from '../providers/email-provider.interface'
import { MockProvider } from '../providers/mock.provider'
import { ResendProvider } from '../providers/resend.provider'
import type { TemplateConfig } from './template-config.interface'
import { DEFAULT_BRAND, DEFAULT_THEME } from './template-config.interface'
import { templateRegistry } from './template-registry'

export interface MailServiceConfig {
  provider: EmailProviderConfig
  template?: Partial<TemplateConfig>
  fromEmail?: string
  fromName?: string
  replyTo?: string
}

export interface SendEmailOptions<T extends unknown[] = unknown[]> {
  to: string
  template: string
  templateArgs?: T
  headers?: Record<string, string>
}

export class MailService {
  private provider: EmailProvider
  private templateConfig: TemplateConfig

  constructor(private config: MailServiceConfig) {
    this.provider = this.createProvider(config.provider)
    this.templateConfig = this.createTemplateConfig(config.template)
  }

  async send<T extends unknown[]>(options: SendEmailOptions<T>): Promise<{ id: string }> {
    // Create template instance
    const template = this.createTemplate(options.template, options.templateArgs)

    // Generate email content
    const subject = template.subject()
    const html = template.html()

    // Prepare email data
    const emailData = {
      to: options.to,
      from: this.getFromAddress(),
      replyTo: this.config.replyTo ?? this.templateConfig.brand.supportEmail,
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': createId(),
        ...options.headers,
      },
    }

    // Send via provider
    return await this.provider.send(emailData)
  }

  listTemplates(): string[] {
    return templateRegistry.list()
  }

  hasTemplate(name: string): boolean {
    return templateRegistry.has(name)
  }

  validateProvider(): boolean {
    return this.provider.validateConfig()
  }

  private createProvider(config: EmailProviderConfig): EmailProvider {
    switch (config.type) {
      case 'resend':
        return new ResendProvider(config.apiKey ?? process.env.RESEND_API_KEY ?? '')
      case 'mock':
        return new MockProvider()
      default:
        throw new Error(`Unsupported email provider: ${config.type}`)
    }
  }

  private createTemplateConfig(partial?: Partial<TemplateConfig>): TemplateConfig {
    return {
      theme: { ...DEFAULT_THEME, ...partial?.theme },
      brand: { ...DEFAULT_BRAND, ...partial?.brand },
    }
  }

  private createTemplate<T extends unknown[]>(
    name: string,
    args: T = [] as unknown as T
  ): EmailTemplate {
    return templateRegistry.create(name, this.templateConfig, ...args)
  }

  private getFromAddress(): string {
    const fromName = this.config.fromName ?? this.templateConfig.brand.name
    const fromEmail = this.config.fromEmail ?? 'no_reply@onboarding.golive.me'
    return `${fromName} <${fromEmail}>`
  }
}

// Factory function for easy instantiation
export function createMailService(config?: Partial<MailServiceConfig>): MailService {
  const defaultConfig: MailServiceConfig = {
    provider: {
      type: process.env.NODE_ENV === 'test' ? 'mock' : 'resend',
      apiKey: process.env.RESEND_API_KEY,
    },
  }

  return new MailService({ ...defaultConfig, ...config })
}
