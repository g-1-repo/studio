import type { BrandConfig, TemplateTheme } from '../../core/template-config.interface'

export interface ComponentProps {
  theme: TemplateTheme
  brand: BrandConfig
}

export class TemplateComponents {
  constructor(private props: ComponentProps) {}

  header(): string {
    const { brand, theme } = this.props
    return /* html */ `
      <div class="header" style="
        text-align: center;
        padding: ${theme.spacing.large} 0;
        border-bottom: 1px solid #eee;
        margin-bottom: ${theme.spacing.large};
      ">
        ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}" style="max-height: 50px; margin-bottom: ${theme.spacing.normal};" />` : ''}
        <h1 style="
          color: ${theme.primaryColor};
          font-size: ${theme.fontSize.title};
          font-weight: 700;
          margin: 0;
        ">${brand.name}</h1>
      </div>
    `
  }

  footer(): string {
    const { brand, theme } = this.props
    return /* html */ `
      <div class="footer" style="
        border-top: 1px solid #eee;
        padding: ${theme.spacing.large} 0;
        margin-top: ${theme.spacing.large};
        text-align: center;
        color: #666;
        font-size: ${theme.fontSize.small};
      ">
        <p style="margin: 0 0 ${theme.spacing.small} 0;">
          Need help? Contact us at <a href="mailto:${brand.supportEmail}" style="color: ${theme.accentColor};">${brand.supportEmail}</a>
        </p>
        ${brand.website ? `<p style="margin: 0;"><a href="${brand.website}" style="color: ${theme.accentColor};">${brand.website}</a></p>` : ''}
        ${brand.address ? `<p style="margin: ${theme.spacing.small} 0 0 0;">${brand.address}</p>` : ''}
      </div>
    `
  }

  button(text: string, url: string, variant: 'primary' | 'secondary' = 'primary'): string {
    const { theme } = this.props
    const bgColor = variant === 'primary' ? theme.accentColor : theme.secondaryColor
    return /* html */ `
      <div style="text-align: center; margin: ${theme.spacing.large} 0;">
        <a href="${url}" style="
          display: inline-block;
          padding: ${theme.spacing.normal} ${theme.spacing.large};
          background-color: ${bgColor};
          color: white;
          text-decoration: none;
          border-radius: ${theme.borderRadius};
          font-weight: 600;
          font-size: ${theme.fontSize.normal};
        ">${text}</a>
      </div>
    `
  }

  codeBlock(code: string, label?: string): string {
    const { theme } = this.props
    return /* html */ `
      <div style="
        text-align: center;
        margin: ${theme.spacing.large} 0;
        padding: ${theme.spacing.large};
        background-color: #f8f9fa;
        border-radius: ${theme.borderRadius};
      ">
        ${label ? `<p style="margin: 0 0 ${theme.spacing.small} 0; font-weight: 600; color: ${theme.secondaryColor};">${label}</p>` : ''}
        <div style="
          font-family: 'Courier New', monospace;
          font-size: ${theme.fontSize.large};
          font-weight: 700;
          color: #e74c3c;
          letter-spacing: 2px;
        ">${code}</div>
        <p style="
          margin: ${theme.spacing.small} 0 0 0;
          font-size: ${theme.fontSize.small};
          color: #7f8c8d;
          font-style: italic;
        ">This code expires in 15 minutes</p>
      </div>
    `
  }

  alert(message: string, type: 'info' | 'warning' | 'success' = 'info'): string {
    const { theme } = this.props
    const colors = {
      info: { bg: '#e3f2fd', border: '#1976d2', text: '#0d47a1' },
      warning: { bg: '#fff3e0', border: '#f57c00', text: '#e65100' },
      success: { bg: '#e8f5e8', border: '#4caf50', text: '#2e7d32' },
    }
    const color = colors[type]

    return /* html */ `
      <div style="
        padding: ${theme.spacing.normal};
        background-color: ${color.bg};
        border-left: 4px solid ${color.border};
        border-radius: ${theme.borderRadius};
        margin: ${theme.spacing.normal} 0;
      ">
        <p style="
          margin: 0;
          color: ${color.text};
          font-size: ${theme.fontSize.normal};
        ">${message}</p>
      </div>
    `
  }
}
