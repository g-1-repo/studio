import { beforeAll, afterEach, vi } from 'vitest'

/**
 * Global test setup for G1 Core package
 */

beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  
  // Mock console methods to reduce noise during tests
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks()
})

// Global test utilities
global.testUtils = {
  createMockContext: () => ({
    env: {},
    var: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    json: vi.fn(),
    text: vi.fn(),
    html: vi.fn(),
    redirect: vi.fn(),
    status: vi.fn(),
    header: vi.fn(),
  }),
}