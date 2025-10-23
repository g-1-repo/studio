import type { TemplateConfig } from '../../core/template-config.interface'
import { LayoutEmailTemplate } from '../base/layout.template'

export class LoginLinkVerificationEmail extends LayoutEmailTemplate {
  constructor(
    config: TemplateConfig,
    private readonly url: string,
  ) {
    super(config)
  }

  subject(): string {
    return 'Verify Your Email Address'
  }

  protected getBodyContent(): string {
    return /* html */ `
      <h1 class="title">Verify your email address</h1>
      
      <p>
        We're excited to have you on board with ${this.config.brand.name}! To ensure your account remains secure, 
        we're sending you a one-time verification link to confirm your identity.
      </p>
      
      ${this.components.button('Verify Email Address', this.url)}
      
      <p>
        This link will verify your email address and complete your registration with us. 
        If you have trouble clicking the button, you can copy and paste the following URL into your web browser:
      </p>
      
      <div style="
        word-break: break-all; 
        font-size: ${this.config.theme.fontSize.small}; 
        color: #666;
        background-color: #f8f9fa;
        padding: ${this.config.theme.spacing.normal};
        border-radius: ${this.config.theme.borderRadius};
        margin: ${this.config.theme.spacing.normal} 0;
      ">
        ${this.url}
      </div>
      
      ${this.components.alert(
        'Please note that this link is only valid for 15 minutes, so be sure to click it as soon as possible.',
        'warning',
      )}
      
      <p>
        Thank you for joining us, and we look forward to staying in touch!
      </p>
      
      <p>
        Best regards,<br />
        The ${this.config.brand.name} Team
      </p>
    `
  }
}
