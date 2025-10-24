import { templateRegistry } from '../core/template-registry'
import { EarlyAccessEmail } from './emails/early-access.template'
import { EmailChangeRequestEmail } from './emails/email-change-request.template'
import { ResetPasswordEmail } from './emails/email-reset-password.template'
import { LoginLinkVerificationEmail } from './emails/login-link-verification.template'
import { LoginOTPVerificationEmail } from './emails/login-otp-verification.template'

// Register all templates
templateRegistry.register('early-access', (config) => {
  return new EarlyAccessEmail(config)
})

templateRegistry.register('login-otp-verification', (config, code: string) => {
  return new LoginOTPVerificationEmail(config, code)
})

templateRegistry.register('email-change-request', (config, url: string, username: string, name: string, newEmail: string) => {
  return new EmailChangeRequestEmail(config, url, username, name, newEmail)
})

templateRegistry.register('reset-password', (config, url: string, username: string, name: string) => {
  return new ResetPasswordEmail(config, url, username, name)
})

templateRegistry.register('login-link-verification', (config, url: string) => {
  return new LoginLinkVerificationEmail(config, url)
})

// Export template names for type safety
export const TEMPLATE_NAMES = {
  EARLY_ACCESS: 'early-access',
  LOGIN_OTP_VERIFICATION: 'login-otp-verification',
  EMAIL_CHANGE_REQUEST: 'email-change-request',
  RESET_PASSWORD: 'reset-password',
  LOGIN_LINK_VERIFICATION: 'login-link-verification',
} as const

export type TemplateName = typeof TEMPLATE_NAMES[keyof typeof TEMPLATE_NAMES]
