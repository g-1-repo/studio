import { z } from 'zod'

// Environment schema for validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  MY_API_PROJECT_DB: z.any().optional(),

  // KV Storage
  MY_API_PROJECT_KV_AUTH: z.any().optional(),

  // Authentication
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // Rate limiting and security
  RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(env: Record<string, any>): Env {
  try {
    return envSchema.parse(env)
  }
  catch (error) {
    console.error('Environment validation failed:', error)
    throw new Error('Invalid environment configuration')
  }
}
