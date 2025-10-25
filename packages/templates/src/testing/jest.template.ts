import type { Config } from 'jest'

/**
 * Jest configuration templates for different testing scenarios
 */

export interface JestTemplateConfig {
  testDir?: string
  setupFiles?: string[]
  setupFilesAfterEnv?: string[]
  testEnvironment?: 'node' | 'jsdom' | 'happy-dom'
  collectCoverage?: boolean
  coverageDirectory?: string
  coverageReporters?: string[]
  testTimeout?: number
  maxWorkers?: number | string
  verbose?: boolean
  silent?: boolean
  bail?: number | boolean
  forceExit?: boolean
  detectOpenHandles?: boolean
  moduleNameMapping?: Record<string, string>
  transform?: Record<string, string | [string, any]>
  extensionsToTreatAsEsm?: string[]
  globals?: Record<string, any>
}

/**
 * Base Jest configuration
 */
export function createBaseJestConfig(options: JestTemplateConfig = {}): Config {
  return {
    preset: 'ts-jest',
    testEnvironment: options.testEnvironment || 'node',
    roots: [options.testDir || '<rootDir>/src'],
    testMatch: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/*.(test|spec).{js,jsx,ts,tsx}'
    ],
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/build/',
      '/coverage/'
    ],
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          target: 'es2022'
        }
      }],
      ...options.transform
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleNameMapping: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^~/(.*)$': '<rootDir>/$1',
      ...options.moduleNameMapping
    },
    setupFiles: options.setupFiles || [],
    setupFilesAfterEnv: options.setupFilesAfterEnv || [],
    testTimeout: options.testTimeout || 10000,
    maxWorkers: options.maxWorkers || '50%',
    verbose: options.verbose || false,
    silent: options.silent || false,
    bail: options.bail || false,
    forceExit: options.forceExit || false,
    detectOpenHandles: options.detectOpenHandles || true,
    collectCoverage: options.collectCoverage || false,
    coverageDirectory: options.coverageDirectory || 'coverage',
    coverageReporters: options.coverageReporters || ['text', 'lcov', 'html'],
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{js,jsx,ts,tsx}',
      '!src/**/*.test.{js,jsx,ts,tsx}',
      '!src/**/*.spec.{js,jsx,ts,tsx}',
      '!src/test/**/*',
      '!src/**/__tests__/**/*',
      '!src/**/__mocks__/**/*'
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    extensionsToTreatAsEsm: options.extensionsToTreatAsEsm || ['.ts', '.tsx'],
    globals: {
      'ts-jest': {
        useESM: true
      },
      ...options.globals
    },
    clearMocks: true,
    restoreMocks: true,
    resetMocks: true
  }
}

/**
 * Unit testing configuration
 */
export function createUnitTestConfig(options: JestTemplateConfig = {}): Config {
  return {
    ...createBaseJestConfig(options),
    displayName: 'Unit Tests',
    testMatch: [
      '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
      '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}'
    ],
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/',
      '/build/',
      '/coverage/',
      '**/*.integration.test.{js,jsx,ts,tsx}',
      '**/*.e2e.test.{js,jsx,ts,tsx}'
    ],
    setupFilesAfterEnv: [
      ...(options.setupFilesAfterEnv || []),
      '<rootDir>/src/test/setup/unit.setup.ts'
    ],
    testTimeout: 5000,
    maxWorkers: '75%'
  }
}

/**
 * Integration testing configuration
 */
export function createIntegrationTestConfig(options: JestTemplateConfig = {}): Config {
  return {
    ...createBaseJestConfig(options),
    displayName: 'Integration Tests',
    testMatch: [
      '<rootDir>/src/**/*.integration.test.{js,jsx,ts,tsx}',
      '<rootDir>/tests/integration/**/*.{js,jsx,ts,tsx}'
    ],
    setupFilesAfterEnv: [
      ...(options.setupFilesAfterEnv || []),
      '<rootDir>/src/test/setup/integration.setup.ts'
    ],
    globalSetup: '<rootDir>/src/test/setup/global.setup.ts',
    globalTeardown: '<rootDir>/src/test/setup/global.teardown.ts',
    testTimeout: 30000,
    maxWorkers: 2,
    runInBand: true // Run integration tests sequentially
  }
}

/**
 * E2E testing configuration
 */
export function createE2ETestConfig(options: JestTemplateConfig = {}): Config {
  return {
    ...createBaseJestConfig(options),
    displayName: 'E2E Tests',
    testMatch: [
      '<rootDir>/e2e/**/*.{js,jsx,ts,tsx}',
      '<rootDir>/src/**/*.e2e.test.{js,jsx,ts,tsx}'
    ],
    setupFilesAfterEnv: [
      ...(options.setupFilesAfterEnv || []),
      '<rootDir>/e2e/setup/e2e.setup.ts'
    ],
    globalSetup: '<rootDir>/e2e/setup/global.setup.ts',
    globalTeardown: '<rootDir>/e2e/setup/global.teardown.ts',
    testTimeout: 60000,
    maxWorkers: 1,
    runInBand: true, // Run E2E tests sequentially
    bail: 1, // Stop on first failure
    detectOpenHandles: true,
    forceExit: true
  }
}

/**
 * Multi-project configuration
 */
export function createMultiProjectConfig(): Config {
  return {
    projects: [
      {
        ...createUnitTestConfig(),
        displayName: 'unit'
      },
      {
        ...createIntegrationTestConfig(),
        displayName: 'integration'
      },
      {
        ...createE2ETestConfig(),
        displayName: 'e2e'
      }
    ],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html', 'json-summary']
  }
}

/**
 * Setup file templates
 */
export const JEST_SETUP_FILES = {
  unit: `// Unit test setup for Jest
import 'jest-extended'

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'sqlite://memory',
  JWT_SECRET: 'test-secret'
}

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
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  }),
  
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
}

// Setup and teardown
beforeEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})

afterEach(() => {
  jest.restoreAllMocks()
})`,

  integration: `// Integration test setup for Jest
import { createTestDatabase, cleanupTestDatabase } from '../helpers/database'
import { createTestServer, stopTestServer } from '../helpers/server'

let testDb: any
let testServer: any

// Setup before all tests
beforeAll(async () => {
  // Create test database
  testDb = await createTestDatabase()
  
  // Start test server
  testServer = await createTestServer({
    database: testDb,
    port: 0 // Use random available port
  })
}, 30000)

// Cleanup after all tests
afterAll(async () => {
  if (testServer) {
    await stopTestServer(testServer)
  }
  if (testDb) {
    await cleanupTestDatabase(testDb)
  }
}, 30000)

// Reset database state before each test
beforeEach(async () => {
  if (testDb) {
    await testDb.migrate.rollback()
    await testDb.migrate.latest()
    await testDb.seed.run()
  }
}, 10000)

// Global test utilities for integration tests
global.integrationUtils = {
  getTestDb: () => testDb,
  getTestServer: () => testServer,
  
  createAuthenticatedRequest: async (user = {}) => {
    const token = await generateTestToken(user)
    return {
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    }
  },
  
  makeRequest: async (method: string, path: string, options = {}) => {
    const baseUrl = testServer.info.uri
    const response = await fetch(\`\${baseUrl}\${path}\`, {
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

  e2e: `// E2E test setup for Jest
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

  global: `// Global setup for Jest
import { execSync } from 'child_process'

export default async function globalSetup() {
  console.log('Running global Jest setup...')
  
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
  
  console.log('Global Jest setup complete')
}`,

  globalTeardown: `// Global teardown for Jest
import { execSync } from 'child_process'

export default async function globalTeardown() {
  console.log('Running global Jest teardown...')
  
  // Cleanup test artifacts
  try {
    execSync('rm -f test.db test.db-*', { stdio: 'inherit' })
  } catch (error) {
    // Ignore cleanup errors
  }
  
  console.log('Global Jest teardown complete')
}`
}

/**
 * Package.json scripts for Jest testing
 */
export const JEST_TEST_SCRIPTS = {
  basic: {
    'test': 'jest',
    'test:watch': 'jest --watch',
    'test:coverage': 'jest --coverage',
    'test:ci': 'jest --ci --coverage --watchAll=false'
  },
  
  comprehensive: {
    'test': 'jest',
    'test:watch': 'jest --watch',
    'test:coverage': 'jest --coverage',
    'test:ci': 'jest --ci --coverage --watchAll=false',
    'test:unit': 'jest --selectProjects unit',
    'test:integration': 'jest --selectProjects integration',
    'test:e2e': 'jest --selectProjects e2e',
    'test:all': 'jest --selectProjects unit integration e2e',
    'test:debug': 'node --inspect-brk node_modules/.bin/jest --runInBand'
  }
}

/**
 * Dependencies for Jest testing setups
 */
export const JEST_TEST_DEPENDENCIES = {
  basic: {
    devDependencies: {
      'jest': '^29.0.0',
      'ts-jest': '^29.0.0',
      '@types/jest': '^29.0.0',
      'jest-extended': '^4.0.0'
    }
  },
  
  comprehensive: {
    devDependencies: {
      'jest': '^29.0.0',
      'ts-jest': '^29.0.0',
      '@types/jest': '^29.0.0',
      'jest-extended': '^4.0.0',
      'jest-environment-jsdom': '^29.0.0',
      'jest-environment-node': '^29.0.0',
      '@testing-library/jest-dom': '^6.0.0',
      'jest-mock-extended': '^3.0.0'
    }
  }
}

/**
 * TypeScript configuration for Jest
 */
export const JEST_TSCONFIG = {
  compilerOptions: {
    target: 'es2022',
    module: 'esnext',
    moduleResolution: 'node',
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    skipLibCheck: true,
    strict: true,
    types: ['jest', 'node', 'jest-extended'],
    baseUrl: '.',
    paths: {
      '@/*': ['src/*'],
      '~/*': ['./*']
    }
  },
  include: [
    'src/**/*',
    'tests/**/*',
    'e2e/**/*',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  exclude: [
    'node_modules',
    'dist',
    'build',
    'coverage'
  ]
}

export default {
  createBaseJestConfig,
  createUnitTestConfig,
  createIntegrationTestConfig,
  createE2ETestConfig,
  createMultiProjectConfig,
  JEST_SETUP_FILES,
  JEST_TEST_SCRIPTS,
  JEST_TEST_DEPENDENCIES,
  JEST_TSCONFIG
}