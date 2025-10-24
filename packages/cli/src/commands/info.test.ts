import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock logger
const mockLogger = {
  info: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  newLine: vi.fn(),
  header: vi.fn(),
  subheader: vi.fn(),
  listItem: vi.fn(),
  code: vi.fn(),
  table: vi.fn(),
  startSpinner: vi.fn(),
  updateSpinner: vi.fn(),
  succeedSpinner: vi.fn(),
  failSpinner: vi.fn(),
  stopSpinner: vi.fn(),
}

vi.mock('../utils/logger.js', () => ({
  Logger: vi.fn().mockImplementation(() => mockLogger),
  default: mockLogger,
}))

vi.mock('fs-extra', () => ({
  pathExists: vi.fn(),
  readdir: vi.fn(),
}))

vi.mock('../utils/file-system.js', () => ({
  readJsonFile: vi.fn(),
  getDirectorySize: vi.fn(),
  formatFileSize: vi.fn(),
}))

vi.mock('../utils/package-manager.js', () => ({
  detectPackageManager: vi.fn(),
  getAvailablePackageManagers: vi.fn(),
}))

vi.mock('../utils/git.js', () => ({
  isGitRepository: vi.fn(),
  getGitUserInfo: vi.fn(),
}))

describe('info Command', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('command Configuration', () => {
    it('should export logger instance', async () => {
      const { logger } = await import('./info')
      
      expect(logger).toBeDefined()
      expect(typeof logger).toBe('object')
    })
  })
})