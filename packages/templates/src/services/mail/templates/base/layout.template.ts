import type { TemplateConfig } from '../../core/template-config.interface'
import type { EmailTemplate } from '../../interfaces/email-template.interface'
import { TemplateComponents } from './components'

export abstract class LayoutEmailTemplate implements EmailTemplate {
  protected components: TemplateComponents

  constructor(protected config: TemplateConfig) {
    this.components = new TemplateComponents({
      theme: config.theme,
      brand: config.brand,
    })
  }

  abstract subject(): string
  protected abstract getBodyContent(): string

  html(): string {
    const { theme } = this.config
    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Message</title>
          <style>
            body {
              font-family: ${theme.fontFamily};
              line-height: 1.6;
              color: ${theme.textColor};
              max-width: 600px;
              margin: 0 auto;
              padding: ${theme.spacing.large};
              background-color: ${theme.backgroundColor};
            }
            .content {
              padding: ${theme.spacing.large} 0;
            }
            .title {
              font-size: ${theme.fontSize.title};
              font-weight: 700;
              margin-bottom: ${theme.spacing.large};
              color: ${theme.primaryColor};
            }
            .subtitle {
              font-size: ${theme.fontSize.large};
              font-weight: 600;
              margin-bottom: ${theme.spacing.normal};
              color: ${theme.secondaryColor};
            }
            p {
              margin-bottom: ${theme.spacing.normal};
              font-size: ${theme.fontSize.normal};
            }
            a {
              color: ${theme.accentColor};
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            .text-center {
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${this.components.header()}
          <div class="content">
            ${this.getBodyContent()}
          </div>
          ${this.components.footer()}
        </body>
      </html>
    `
  }
}
