import type { TemplateConfig } from '../../core/template-config.interface'
import { LayoutEmailTemplate } from '../base/layout.template'

export class LoginOTPVerificationEmail extends LayoutEmailTemplate {
  constructor(
    config: TemplateConfig,
    private readonly code: string
  ) {
    super(config)
  }

  subject(): string {
    return 'Email Verification'
  }

  protected getBodyContent(): string {
    return /* html */ `
      <h1 class="title">Verify your email address</h1>
      
      <p>
        We're excited to have you on board with ${this.config.brand.name}! To ensure your account remains secure, 
        we're sending you a one-time verification code to confirm your identity.
      </p>
      
      ${this.components.codeBlock(this.code, 'Verification Code')}
      
      <p>
        Please enter this code when prompted to complete the verification process. If you have any questions or need assistance, feel free to reach out to us.
      </p>
      
      ${this.components.alert(
        "If you've received this message by mistake, you can safely disregard it.",
        'info'
      )}
      
      <p>
        Best regards,<br />
        The ${this.config.brand.name} Team
      </p>
    `
  }
}
