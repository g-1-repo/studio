import type { TemplateConfig } from '../../core/template-config.interface'
import { LayoutEmailTemplate } from '../base/layout.template'

export class EmailChangeRequestEmail extends LayoutEmailTemplate {
  constructor(
    config: TemplateConfig,
    private readonly url: string,
    private readonly username: string,
    private readonly name: string,
    private readonly newEmail: string,
  ) {
    super(config)
  }

  subject(): string {
    return 'Email Change Request'
  }

  protected getBodyContent(): string {
    return /* html */ `
      <h1 class="title">Email Change Request</h1>
      
      <p>Dear ${this.name},</p>
      
      <p>
        We've received a request to update the email address associated with your ${this.username} account. 
        If you didn't make this request, please ignore this email and your email address will remain unchanged.
      </p>
      
      ${this.components.button('Confirm Email Update', this.url)}
      
      <p>
        This link will take you to a secure page to confirm your email change. 
        Please note that this link is only valid for the next 15 minutes and can only be used once.
      </p>
      
      <h2 class="subtitle">New Email Address:</h2>
      ${this.components.codeBlock(this.newEmail)}
      
      <p>
        If this is correct, please click the link above to confirm. If this is not correct, 
        please contact our support team to cancel the request.
      </p>
      
      ${this.components.alert(
        `Once you've confirmed the update, all future emails from ${this.config.brand.name} will be sent to your new email address.`,
        'info',
      )}
      
      <p>
        Best regards,<br />
        The ${this.config.brand.name} Team
      </p>
    `
  }
}
