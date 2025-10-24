import type { TemplateConfig } from '../../core/template-config.interface'
import { LayoutEmailTemplate } from '../base/layout.template'

export class ResetPasswordEmail extends LayoutEmailTemplate {
  constructor(
    config: TemplateConfig,
    private readonly url: string,
    private readonly username: string,
    private readonly name: string
  ) {
    super(config)
  }

  subject(): string {
    return 'Reset your password'
  }

  protected getBodyContent(): string {
    return /* html */ `
      <h1 class="title">Reset your password</h1>
      
      <p>Dear ${this.name},</p>
      
      <p>
        We've received a request to reset your password for your ${this.username} account. 
        If you didn't make this request, please ignore this email and your password will remain unchanged.
      </p>
      
      ${this.components.button('Reset Password', this.url)}
      
      <p>
        This link will take you to a secure page where you can enter a new password. 
        Please note that this link is only valid for the next 15 minutes and can only be used once.
      </p>
      
      ${this.components.alert(
        "If you have any questions or concerns, please don't hesitate to reach out to us. We're here to help.",
        'info'
      )}
      
      <p>
        Best regards,<br />
        The ${this.config.brand.name} Team
      </p>
    `
  }
}
