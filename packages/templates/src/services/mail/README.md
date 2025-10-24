# Mail Service

Optimized email service with provider abstraction, component-based templates, and comprehensive testing support.

## Features

- **Provider Abstraction**: Easy switching between email providers (Resend, Mock for testing)
- **Component-Based Templates**: Reusable UI components for consistent email design
- **Template Registry**: Centralized template management with caching
- **Testing Support**: Isolated test utilities with email capture
- **Type Safety**: Full TypeScript support with template constants

## Quick Start

```typescript
import { createMailService, TEMPLATE_NAMES } from '@/lib/services/mail'

// Create service (auto-detects environment)
const mailService = createMailService()

// Send an email
await mailService.send({
  to: 'user@example.com',
  template: TEMPLATE_NAMES.EARLY_ACCESS
})

// Send with template arguments
await mailService.send({
  to: 'user@example.com',
  template: TEMPLATE_NAMES.LOGIN_OTP_VERIFICATION,
  templateArgs: ['123456']
})
```

## Configuration

### Provider Configuration

```typescript
import { createMailService } from '@/lib/services/mail'

const mailService = createMailService({
  provider: {
    type: 'resend',
    apiKey: process.env.RESEND_API_KEY
  },
  fromEmail: 'no-reply@yourapp.com',
  fromName: 'Your App',
  replyTo: 'support@yourapp.com'
})
```

### Template Customization

```typescript
import { createMailService } from '@/lib/services/mail'

const mailService = createMailService({
  template: {
    brand: {
      name: 'Custom Brand',
      supportEmail: 'help@custom.com',
      logo: 'https://example.com/logo.png'
    },
    theme: {
      primaryColor: '#ff6b35',
      accentColor: '#4ecdc4'
    }
  }
})
```

## Available Templates

- `TEMPLATE_NAMES.EARLY_ACCESS` - Early access confirmation
- `TEMPLATE_NAMES.LOGIN_OTP_VERIFICATION` - OTP verification code
- `TEMPLATE_NAMES.EMAIL_CHANGE_REQUEST` - Email change confirmation
- `TEMPLATE_NAMES.RESET_PASSWORD` - Password reset link
- `TEMPLATE_NAMES.LOGIN_LINK_VERIFICATION` - Magic link verification

## Testing

```typescript
import { clearEmails, getEmails } from '@/lib/services/mail'

// Get captured emails in tests
const emails = getEmails()

// Clear email outbox
clearEmails()
```

## Architecture

```
src/lib/services/mail/
├── core/
│   ├── mail.service.ts          # Main orchestrator
│   ├── template-registry.ts     # Template management
│   └── template-config.interface.ts
├── providers/
│   ├── email-provider.interface.ts
│   ├── resend.provider.ts
│   └── mock.provider.ts
├── templates/
│   ├── base/
│   │   ├── layout.template.ts   # Main layout
│   │   └── components.ts        # Reusable components
│   ├── emails/                  # Specific email types
│   └── registry.ts              # Template registration
└── testing/
    └── test-mailbox.ts          # Test utilities
```

## Adding New Templates

1. Create template class extending `LayoutEmailTemplate`
2. Register in `templates/registry.ts`
3. Add to `TEMPLATE_NAMES` constant

```typescript
// templates/emails/welcome.template.ts
export class WelcomeEmail extends LayoutEmailTemplate {
  constructor(config: TemplateConfig, private userName: string) {
    super(config)
  }

  subject(): string {
    return `Welcome, ${this.userName}!`
  }

  protected getBodyContent(): string {
    return `
      <h1 class="title">Welcome!</h1>
      <p>Hello ${this.userName}, welcome to our platform!</p>
      ${this.components.button('Get Started', 'https://app.com/onboard')}
    `
  }
}

// templates/registry.ts
templateRegistry.register('welcome', (config, userName: string) => {
  return new WelcomeEmail(config, userName)
})
```

## Migration from Legacy Service

The new service is backward compatible through the index exports. Update imports:

```typescript
// New
import { createMailService } from '@/lib/services/mail'

// Old
import { MailerService } from '@/lib/services/mail/mailer.service'
```
