// Import template registry to ensure registration
import './templates/registry'

// Export main service and types
export { createMailService, MailService } from './core/mail.service'
export type {
  MailServiceConfig,
  SendEmailOptions,
} from './core/mail.service'

export type {
  BrandConfig,
  TemplateConfig,
  TemplateTheme,
} from './core/template-config.interface'

// Export template types
export type { EmailTemplate } from './interfaces/email-template.interface'
// Legacy compatibility (deprecated - will be removed)
export { MailerService } from './mailer.service'

export type { MailerConfig } from './mailer.service'
// Export provider types
export type {
  EmailData,
  EmailProvider,
  EmailProviderConfig,
} from './providers/email-provider.interface'

// Export template constants
export { TEMPLATE_NAMES } from './templates/registry'
export type { TemplateName } from './templates/registry'

// Export testing utilities
export {
  clearEmails,
  getEmails,
  recordEmail,
} from './testing/test-mailbox'
export type { TestEmail } from './testing/test-mailbox'
