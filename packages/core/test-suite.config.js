export default {
  // Package metadata
  packageName: 'api-boilerplate',
  packageType: 'api',

  // Runtime preferences
  runtime: 'bun', // Cloudflare Workers with Bun
  database: 'drizzle-d1',

  // Test categories with patterns
  categories: {
    auth: 'test/auth*.test.ts',
    api: 'test/*routes*.test.ts',
    health: 'test/health*.test.ts',
    permissions: 'test/permissions*.test.ts',
    email: 'test/email*.test.ts',
    repository: 'test/*repository*.test.ts',
    core: 'test/{not-found,error-handling,time-control,rate-limiting,security-headers}.test.ts',
  },

  // Test setup
  setupFiles: ['test/setup.ts'],
  testDir: 'test',
  testMatch: ['test/**/*.test.ts'],
  testIgnore: ['**/node_modules/**', '**/dist/**'],

  // Execution options
  parallel: true,
  maxWorkers: 4,
  timeout: 30000,
  coverage: false, // Only enable with explicit --coverage flag

  // Output preferences
  reporter: 'default',
  verbose: false,

  // Advanced options
  bail: false,
  detectOpenHandles: true,
  forceExit: false,

  // Environment variables for testing
  env: {
    NODE_ENV: 'test',
    TEST_RUNNER: 'g1-test-suite',
    // Cloudflare Workers specific
    ENVIRONMENT: 'test',
  },

  // Vitest configuration for compatibility
  vitest: {
    resolve: {
      alias: {
        '@': './src',
        // Test-only stubs to avoid Node internals in Workers runtime
        pino: './test/stubs/pino.ts',
        'pino-abstract-transport': './test/stubs/empty.ts',
        'pino-pretty': './test/stubs/empty.ts',
        'hono-pino': './test/stubs/hono-pino.ts',
        // Cloudflare Workers-compatible cuid2 stub
        '@paralleldrive/cuid2': './test/stubs/cuid2.ts',
      },
    },
    optimizeDeps: {
      exclude: ['@g-1/util'],
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
  },

  // Enterprise features
  telemetry: {
    enabled: false,
  },

  notifications: {
    enabled: false,
  },
}
