/**
 * Environment configuration types for Cloudflare Workers
 */

export interface Environment {
  // Database bindings
  DB?: D1Database

  // KV bindings
  MY_API_PROJECT_KV_AUTH?: KVNamespace

  // Environment variables
  NODE_ENV?: string
  BETTER_AUTH_SECRET?: string
  BETTER_AUTH_URL?: string
  CLOUDFLARE_ACCOUNT_ID?: string
  CLOUDFLARE_DATABASE_ID?: string
  CLOUDFLARE_D1_TOKEN?: string

  // Email service
  RESEND_API_KEY?: string

  // Optional environment variables
  LOG_LEVEL?: string
  TEST_MODE?: string
  MOCK_EMAIL_SERVICE?: string
}

// Default environment for development
export const defaultEnvironment: Partial<Environment> = {
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
}
