import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { defineWorkersProject } from '@cloudflare/vitest-pool-workers/config'
import { config } from 'dotenv'

export default defineWorkersProject(async () => {
  // Load test environment variables
  config({ path: '.env.test' })
  // Ensure process.env reflects test runtime for code paths that read it directly
  process.env.NODE_ENV = 'test'

  const migrationsPath = path.join(__dirname, './src/db/migrations')
  // Manually read .sql files and split by drizzle statement-breakpoint markers
  let MIGRATION_STATEMENTS: string[] = []
  try {
    const entries = await readdir(migrationsPath)
    const sqlFiles = entries.filter(f => f.endsWith('.sql')).sort()
    const contents = await Promise.all(
      sqlFiles.map(f => readFile(path.join(migrationsPath, f), 'utf8'))
    )
    MIGRATION_STATEMENTS = contents.flatMap(content =>
      content
        .split(/--?>\s*statement-breakpoint\s*/g)
        .map(s => s.trim())
        .filter(Boolean)
    )
  } catch (e) {
    console.error('[vitest] migrations read error:', (e as Error).message)
    MIGRATION_STATEMENTS = []
  }

  // Get Resend API key from environment (with fallback)
  const resendApiKey = process.env.RESEND_API_KEY || 're_test_mock_api_key_for_testing'
  // Ensure process.env has a value early (MailerService reads process.env)
  if (!process.env.RESEND_API_KEY) {
    process.env.RESEND_API_KEY = resendApiKey
  }

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Test-only stubs to avoid Node internals in Workers runtime
        pino: path.resolve(__dirname, './test/stubs/pino.ts'),
        'pino-abstract-transport': path.resolve(__dirname, './test/stubs/empty.ts'),
        'pino-pretty': path.resolve(__dirname, './test/stubs/empty.ts'),
        'hono-pino': path.resolve(__dirname, './test/stubs/hono-pino.ts'),
        // Cloudflare Workers-compatible cuid2 stub
        '@paralleldrive/cuid2': path.resolve(__dirname, './test/stubs/cuid2.ts'),
      },
    },
    define: {
      // Help with module resolution issues
      'process.env.NODE_ENV': JSON.stringify('test'),
    },
    test: {
      setupFiles: ['./test/apply-migrations.ts', './test/setup.ts'],
      globals: true,
      coverage: {
        provider: 'istanbul',
        reportsDirectory: './coverage',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['**/*.test.ts', 'test/**'],
        thresholds: {
          statements: 36,
          branches: 20,
          functions: 28,
          lines: 36,
        },
      },
      poolOptions: {
        workers: {
          singleWorker: true,
          isolatedStorage: false,
          wrangler: { configPath: './wrangler.jsonc' },
          miniflare: {
            compatibilityFlags: ['nodejs_compat', 'nodejs_compat_v2'],
            compatibilityDate: '2024-09-23',
            d1Databases: ['DB'],
            kvNamespaces: ['MY_API_PROJECT_KV_AUTH'],
            bindings: {
              TEST_MIGRATIONS: MIGRATION_STATEMENTS,
              NODE_ENV: 'test',
              TEST_MODE: 'true',
              LOG_LEVEL: 'silent',
              BETTER_AUTH_SECRET: 'test-secret-key-for-authentication-never-use-in-production',
              BETTER_AUTH_URL: 'http://localhost:8787',
              MOCK_EMAIL_SERVICE: 'true',
              CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
              CLOUDFLARE_DATABASE_ID: 'test-database-id',
              CLOUDFLARE_D1_TOKEN: 'test-d1-token',
            },
          },
        },
      },
    },
  }
})
