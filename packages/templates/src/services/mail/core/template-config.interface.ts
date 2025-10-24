export interface TemplateTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  textColor: string
  backgroundColor: string
  fontFamily: string
  fontSize: {
    small: string
    normal: string
    large: string
    title: string
  }
  spacing: {
    small: string
    normal: string
    large: string
  }
  borderRadius: string
}

export interface BrandConfig {
  name: string
  logo?: string
  supportEmail: string
  website?: string
  address?: string
}

export interface TemplateConfig {
  theme: TemplateTheme
  brand: BrandConfig
}

export const DEFAULT_THEME: TemplateTheme = {
  primaryColor: '#2c3e50',
  secondaryColor: '#34495e',
  accentColor: '#3498db',
  textColor: '#333333',
  backgroundColor: '#ffffff',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  fontSize: {
    small: '12px',
    normal: '16px',
    large: '18px',
    title: '24px',
  },
  spacing: {
    small: '8px',
    normal: '16px',
    large: '24px',
  },
  borderRadius: '8px',
}

export const DEFAULT_BRAND: BrandConfig = {
  name: 'Golive',
  supportEmail: 'support@golive.me',
  website: 'https://golive.me',
}
