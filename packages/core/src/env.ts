import { detectRuntime, getEnv, getEnvBoolean, getEnvNumber, requireEnv } from '@g-1/util/env'
import z from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8787),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('silent'),
  CLOUDFLARE_ACCOUNT_ID: z.string(),
  CLOUDFLARE_DATABASE_ID: z.string(),
  CLOUDFLARE_D1_TOKEN: z.string(),
  RESEND_API_KEY: z.string().optional().default(''),
  TEST_MODE: z.string().optional().default(''),
  DB: z.custom<D1Database>(),
  MY_API_PROJECT_KV_AUTH: z.custom<KVNamespace>(),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.url().default('http://localhost:8787'),
})

// Runtime detection helper
export const runtime = detectRuntime()

// Environment helpers using @g-1/util
export const envHelpers = {
  getEnv,
  getEnvNumber,
  getEnvBoolean,
  requireEnv,
  runtime,
  isDev: () => getEnv('NODE_ENV', 'development') === 'development',
  isTest: () => getEnv('NODE_ENV') === 'test',
  isProd: () => getEnv('NODE_ENV') === 'production',
}

export type Environment = z.infer<typeof EnvSchema>

export function parseEnv(data: any) {
  const { data: env, error } = EnvSchema.safeParse(data)
  if (error) {
    const errorMessage = `❌ Invalid env - ${Object.entries(error.flatten().fieldErrors).map(([key, errors]) => `${key}: ${errors.join(',')}`).join(' | ')}`
    throw new Error(errorMessage)
  }

  return env
}
