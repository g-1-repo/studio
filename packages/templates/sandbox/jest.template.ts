import type { Config } from '@jest/types'

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
export function createBaseJestConfig(options: JestTemplateConfig = {}): any {
  // Template implementation - actual Jest configuration would be done at runtime
  throw new Error('Template method - implement Jest configuration in your application')
}

/**
 * Unit test configuration
 */
export function createUnitTestConfig(options: JestTemplateConfig = {}): any {
  // Template implementation - actual unit test configuration would be done at runtime
  throw new Error('Template method - implement unit test configuration in your application')
}

/**
 * Integration test configuration
 */
export function createIntegrationTestConfig(options: JestTemplateConfig = {}): any {
  // Template implementation - actual integration test configuration would be done at runtime
  throw new Error('Template method - implement integration test configuration in your application')
}

/**
 * E2E test configuration
 */
export function createE2ETestConfig(options: JestTemplateConfig = {}): any {
  // Template implementation - actual E2E test configuration would be done at runtime
  throw new Error('Template method - implement E2E test configuration in your application')
}

/**
 * Multi-project configuration
 */
export function createMultiProjectConfig(): any {
  // Template implementation - actual multi-project configuration would be done at runtime
  throw new Error('Template method - implement multi-project configuration in your application')
}

// Template constants - these would be implemented at runtime
export const JEST_SETUP_FILES = {
  unit: '// Template setup file - implement unit test setup in your application',
  integration: '// Template setup file - implement integration test setup in your application',
  e2e: '// Template setup file - implement E2E test setup in your application',
  global: '// Template setup file - implement global setup in your application',
  globalTeardown: '// Template setup file - implement global teardown in your application',
}

export const JEST_TEST_SCRIPTS = {
  basic: {
    test: 'jest',
    'test:watch': 'jest --watch',
    'test:coverage': 'jest --coverage',
    'test:ci': 'jest --ci --coverage --watchAll=false',
  },
  comprehensive: {
    test: 'jest',
    'test:watch': 'jest --watch',
    'test:coverage': 'jest --coverage',
    'test:ci': 'jest --ci --coverage --watchAll=false',
    'test:unit': 'jest --selectProjects unit',
    'test:integration': 'jest --selectProjects integration',
    'test:e2e': 'jest --selectProjects e2e',
    'test:all': 'jest --selectProjects unit integration e2e',
    'test:debug': 'node --inspect-brk node_modules/.bin/jest --runInBand',
  },
}

export const JEST_TEST_DEPENDENCIES = {
  basic: {
    devDependencies: {
      jest: '^29.0.0',
      'ts-jest': '^29.0.0',
      '@types/jest': '^29.0.0',
      'jest-extended': '^4.0.0',
    },
  },
  comprehensive: {
    devDependencies: {
      jest: '^29.0.0',
      'ts-jest': '^29.0.0',
      '@types/jest': '^29.0.0',
      'jest-extended': '^4.0.0',
      'jest-environment-jsdom': '^29.0.0',
      'jest-environment-node': '^29.0.0',
      '@testing-library/jest-dom': '^6.0.0',
      'jest-mock-extended': '^3.0.0',
    },
  },
}

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
    },
  },
  include: ['src/**/*', 'tests/**/*'],
  exclude: ['node_modules', 'dist', 'build', 'coverage'],
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
  JEST_TSCONFIG,
}