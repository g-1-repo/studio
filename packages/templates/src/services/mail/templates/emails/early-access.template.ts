import { LayoutEmailTemplate } from '../base/layout.template'

export class EarlyAccessEmail extends LayoutEmailTemplate {
  subject(): string {
    return 'Thanks for requesting early access!'
  }

  protected getBodyContent(): string {
    return /* html */ `
      <h1 class="title">Thanks for your early access request!</h1>
      
      <p>
        We've received your request for early access to ${this.config.brand.name}. We're thrilled about your 
        interest in being one of the first to experience our platform.
      </p>
      
      ${this.components.alert(
        "We'll be reviewing early access requests and will send you an invitation soon. Keep an eye on your inbox!",
        'info'
      )}
      
      <p>
        Thanks for your excitement and patience,<br/>
        The ${this.config.brand.name} Team
      </p>
    `
  }
}
