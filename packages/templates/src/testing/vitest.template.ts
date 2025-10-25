import { defineConfig, type UserConfig } from 'vitest/config'
import type { InlineConfig } from 'vitest'

/**
 * Vitest configuration templates for different testing scenarios
 */

export interface VitestTemplateConfig {
  testDir?: string
  coverage?: boolean
  ui?: boolean
  browser?: boolean
  environment?: 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime'
  setupFiles?: string[]
  globalSetup?: string[]
  reporters?: string[]
  outputFile?: Record<string, string>
  pool?: 'threads' | 'forks' | 'vmThreads'
  poolOptions?: {
    threads?: {
      singleThread?: boolean
      isolate?: boolean
      useAtomics?: boolean
    }
    forks?: {
      singleFork?: boolean
      isolate?: boolean
    }
  }
  testTimeout?: number
  hookTimeout?: number
  teardownTimeout?: number
  silent?: boolean
  maxConcurrency?: number
  minThreads?: number
  maxThreads?: number
}

/**
 * Base Vitest configuration
 */
export function createBaseVitestConfig(options: VitestTemplateConfig = {}): UserConfig {
  return defineConfig({
    test: {
      globals: true,
      environment: options.environment || 'node',
      setupFiles: options.setupFiles || [],
      globalSetup: options.globalSetup || [],
      testTimeout: options.testTimeout || 10000,
      hookTimeout: options.hookTimeout || 10000,
      teardownTimeout: options.teardownTimeout || 10000,
      silent: options.silent || false,
      maxConcurrency: options.maxConcurrency || 5,
      pool: options.pool || 'threads',
      poolOptions: options.poolOptions || {
        threads: {
          singleThread: false,
          isolate: true,
          useAtomics: true
        }
      },
      minThreads: options.minThreads || 1,
      maxThreads: options.maxThreads || undefined,
      include: [
        `${options.testDir || 'src'}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
      ],
      reporters: options.reporters || ['default'],
      outputFile: options.outputFile,
      coverage: options.coverage ? {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        reportsDirectory: './coverage',
        exclude: [
          'coverage/**',
          'dist/**',
          '**/[.]**',
          'packages/*/test{,s}/**',
          '**/*.d.ts',
          '**/virtual:*',
          '**/__x00__*',
          '**/\x00*',
          'cypress/**',
          'test{,s}/**',
          'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
          '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
          '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
          '**/__tests__/**',
          '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
          '**/vitest.{workspace,projects}.[jt]s{,on}',
          '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}'
        ],
        all: true,
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      } : undefined,
      ui: options.ui || false,
      open: false,
      api: options.ui ? {
        port: 51204,
        strictPort: false,
        host: '127.0.0.1'
      } : undefined
    },
    esbuild: {
      target: 'node18'
    }
  })
}

/**
 * Unit testing configuration
 */
export function createUnitTestConfig(options: VitestTemplateConfig = {}): UserConfig {
  return createBaseVitestConfig({
    ...options,
    testDir: options.testDir || 'src',
    environment: options.environment || 'node',
    setupFiles: [
      ...(options.setupFiles || []),
      './src/test/setup/unit.setup.ts'
    ],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true,
        useAtomics: true
      }
    },
    testTimeout: 5000,
    maxConcurrency: 10
  })
}

/**
 * Integration testing configuration
 */
export function createIntegrationTestConfig(options: VitestTemplateConfig = {}): UserConfig {
  return createBaseVitestConfig({
    ...options,
    testDir: options.testDir || 'src',
    environment: options.environment || 'node',
    setupFiles: [
      ...(options.setupFiles || []),
      './src/test/setup/integration.setup.ts'
    ],
    globalSetup: [
      ...(options.globalSetup || []),
      './src/test/setup/global.setup.ts'
    ],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true
      }
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    maxConcurrency: 3,
    minThreads: 1,
    maxThreads: 3
  })
}

/**
 * E2E testing configuration
 */
export function createE2ETestConfig(options: VitestTemplateConfig = {}): UserConfig {
  return createBaseVitestConfig({
    ...options,
    testDir: options.testDir || 'e2e',
    environment: options.environment || 'node',
    setupFiles: [
      ...(options.setupFiles || []),
      './e2e/setup/e2e.setup.ts'
    ],
    globalSetup: [
      ...(options.globalSetup || []),
      './e2e/setup/global.setup.ts'
    ],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
        isolate: true
      }
    },
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 30000,
    maxConcurrency: 1,
    minThreads: 1,
    maxThreads: 1
  })
}

/**
 * Browser testing configuration (using @vitest/browser)
 */
export function createBrowserTestConfig(options: VitestTemplateConfig = {}): UserConfig {
  return defineConfig({
    test: {
      globals: true,
      environment: 'happy-dom', // Fallback for non-browser tests
      setupFiles: options.setupFiles || [],
      testTimeout: options.testTimeout || 30000,
      include: [
        `${options.testDir || 'src'}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/e2e/**',
        '**/.{idea,git,cache,output,temp}/**'
      ],
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        headless: true,
        screenshotOnFailure: true,
        api: {
          port: 63315,
          strictPort: false,
          host: '127.0.0.1'
        }
      },
      coverage: options.coverage ? {
        provider: 'istanbul',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage/browser'
      } : undefined
    }
  })
}

/**
 * Workspace configuration for multiple test types
 */
export function createWorkspaceConfig(): string {
  return `import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Unit tests
  {
    extends: './vitest.config.ts',
    test: {
      name: 'unit',
      include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      exclude: [
        'src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}',
        'src/**/*.e2e.{test,spec}.{js,ts,jsx,tsx}'
      ],
      environment: 'node',
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: false,
          isolate: true
        }
      }
    }
  },
  
  // Integration tests
  {
    extends: './vitest.config.ts',
    test: {
      name: 'integration',
      include: ['src/**/*.integration.{test,spec}.{js,ts,jsx,tsx}'],
      environment: 'node',
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: false,
          isolate: true
        }
      },
      testTimeout: 30000,
      maxConcurrency: 3
    }
  },
  
  // E2E tests
  {
    extends: './vitest.config.ts',
    test: {
      name: 'e2e',
      include: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
      environment: 'node',
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
          isolate: true
        }
      },
      testTimeout: 60000,
      maxConcurrency: 1
    }
  },
  
  // Browser tests
  {
    extends: './vitest.config.ts',
    test: {
      name: 'browser',
      include: ['src/**/*.browser.{test,spec}.{js,ts,jsx,tsx}'],
      browser: {
        enabled: true,
        name: 'chromium',
        provider: 'playwright',
        headless: true
      }
    }
  }
])`
}

/**
 * Setup file templates
 */
export const SETUP_FILES = {
  unit: `// Unit test setup
import { vi } from 'vitest'

// Mock console methods in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'sqlite://memory',
    JWT_SECRET: 'test-secret',
    ...process.env
  }
}))

// Global test utilities
global.testUtils = {
  createMockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/',
    headers: {},
    body: null,
    ...overrides
  }),
  
  createMockResponse: () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis()
  }),
  
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
}

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
  vi.restoreAllMocks()
})`,

  integration: `// Integration test setup
import { vi } from 'vitest'
import { createTestDatabase, cleanupTestDatabase } from '../helpers/database'
import { createTestServer, stopTestServer } from '../helpers/server'

// Global test database
let testDb: any

// Setup before all tests
beforeAll(async () => {
  // Create test database
  testDb = await createTestDatabase()
  
  // Start test server
  await createTestServer({
    database: testDb,
    port: 0 // Use random available port
  })
})

// Cleanup after all tests
afterAll(async () => {
  await stopTestServer()
  await cleanupTestDatabase(testDb)
})

// Reset database state before each test
beforeEach(async () => {
  if (testDb) {
    await testDb.migrate.rollback()
    await testDb.migrate.latest()
    await testDb.seed.run()
  }
})

// Global test utilities for integration tests
global.integrationUtils = {
  getTestDb: () => testDb,
  
  createAuthenticatedRequest: async (user = {}) => {
    const token = await generateTestToken(user)
    return {
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    }
  },
  
  makeRequest: async (method: string, path: string, options = {}) => {
    const response = await fetch(\`http://localhost:\${process.env.TEST_PORT}\${path}\`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    })
    
    return {
      status: response.status,
      headers: response.headers,
      json: () => response.json(),
      text: () => response.text()
    }
  }
}`,

  e2e: `// E2E test setup
import { vi } from 'vitest'
import { spawn } from 'child_process'
import { createTestDatabase, cleanupTestDatabase } from '../helpers/database'

let testServer: any
let testDb: any

// Global setup - runs once before all tests
beforeAll(async () => {
  console.log('Setting up E2E test environment...')
  
  // Create test database
  testDb = await createTestDatabase()
  
  // Start the application server
  testServer = spawn('bun', ['run', 'dev'], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3001',
      DATABASE_URL: testDb.connectionString
    },
    stdio: 'pipe'
  })
  
  // Wait for server to start
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Server failed to start within timeout'))
    }, 30000)
    
    testServer.stdout.on('data', (data: Buffer) => {
      if (data.toString().includes('Server running')) {
        clearTimeout(timeout)
        resolve(true)
      }
    })
    
    testServer.stderr.on('data', (data: Buffer) => {
      console.error('Server error:', data.toString())
    })
  })
  
  console.log('E2E test environment ready')
}, 60000)

// Global cleanup - runs once after all tests
afterAll(async () => {
  console.log('Cleaning up E2E test environment...')
  
  if (testServer) {
    testServer.kill('SIGTERM')
    await new Promise(resolve => {
      testServer.on('exit', resolve)
      setTimeout(() => {
        testServer.kill('SIGKILL')
        resolve(true)
      }, 5000)
    })
  }
  
  if (testDb) {
    await cleanupTestDatabase(testDb)
  }
  
  console.log('E2E test environment cleaned up')
}, 30000)

// Global E2E utilities
global.e2eUtils = {
  baseUrl: 'http://localhost:3001',
  
  request: async (method: string, path: string, options = {}) => {
    const response = await fetch(\`http://localhost:3001\${path}\`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    })
    
    return {
      status: response.status,
      headers: response.headers,
      json: () => response.json(),
      text: () => response.text()
    }
  },
  
  waitForServer: async (maxAttempts = 30) => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch('http://localhost:3001/health')
        if (response.ok) return true
      } catch (error) {
        // Server not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    throw new Error('Server failed to become ready')
  }
}`,

  global: `// Global setup for all test types
import { execSync } from 'child_process'

export async function setup() {
  console.log('Running global test setup...')
  
  // Ensure test database is clean
  try {
    execSync('bun run db:reset:test', { stdio: 'inherit' })
  } catch (error) {
    console.warn('Failed to reset test database:', error)
  }
  
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.LOG_LEVEL = 'error'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'sqlite://test.db'
  
  console.log('Global test setup complete')
}

export async function teardown() {
  console.log('Running global test teardown...')
  
  // Cleanup test artifacts
  try {
    execSync('rm -f test.db test.db-*', { stdio: 'inherit' })
  } catch (error) {
    // Ignore cleanup errors
  }
  
  console.log('Global test teardown complete')
}`
}

/**
 * Package.json scripts for testing
 */
export const TEST_SCRIPTS = {
  basic: {
    'test': 'vitest',
    'test:run': 'vitest run',
    'test:watch': 'vitest --watch',
    'test:coverage': 'vitest --coverage',
    'test:ui': 'vitest --ui'
  },
  
  comprehensive: {
    'test': 'vitest',
    'test:run': 'vitest run',
    'test:watch': 'vitest --watch',
    'test:coverage': 'vitest --coverage',
    'test:ui': 'vitest --ui',
    'test:unit': 'vitest run --config vitest.unit.config.ts',
    'test:integration': 'vitest run --config vitest.integration.config.ts',
    'test:e2e': 'vitest run --config vitest.e2e.config.ts',
    'test:browser': 'vitest run --config vitest.browser.config.ts',
    'test:all': 'bun run test:unit && bun run test:integration && bun run test:e2e',
    'test:ci': 'vitest run --coverage --reporter=junit --outputFile=test-results.xml'
  }
}

/**
 * Dependencies for different testing setups
 */
export const TEST_DEPENDENCIES = {
  basic: {
    devDependencies: {
      'vitest': '^2.1.0',
      '@vitest/ui': '^2.1.0',
      'happy-dom': '^15.0.0'
    }
  },
  
  comprehensive: {
    devDependencies: {
      'vitest': '^2.1.0',
      '@vitest/ui': '^2.1.0',
      '@vitest/coverage-v8': '^2.1.0',
      '@vitest/browser': '^2.1.0',
      'playwright': '^1.40.0',
      'happy-dom': '^15.0.0',
      'jsdom': '^25.0.0',
      '@testing-library/dom': '^10.0.0',
      '@testing-library/user-event': '^14.0.0',
      'msw': '^2.0.0'
    }
  },
  
  cloudflareWorkers: {
    devDependencies: {
      'vitest': '^2.1.0',
      '@cloudflare/vitest-pool-workers': '^0.5.0',
      'wrangler': '^3.0.0'
    }
  }
}

export default {
  createBaseVitestConfig,
  createUnitTestConfig,
  createIntegrationTestConfig,
  createE2ETestConfig,
  createBrowserTestConfig,
  createWorkspaceConfig,
  SETUP_FILES,
  TEST_SCRIPTS,
  TEST_DEPENDENCIES
}