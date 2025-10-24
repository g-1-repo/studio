import ora from 'ora'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Logger, logger } from './logger'

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    blue: vi.fn(text => `blue(${text})`),
    green: vi.fn(text => `green(${text})`),
    yellow: vi.fn(text => `yellow(${text})`),
    red: vi.fn(text => `red(${text})`),
    gray: vi.fn(text => `gray(${text})`),
    cyan: vi.fn(text => `cyan(${text})`),
    bold: Object.assign(vi.fn(text => `bold(${text})`), {
      cyan: vi.fn(text => `bold.cyan(${text})`),
    }),
    dim: vi.fn(text => `dim(${text})`),
  },
}))

// Mock ora
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  text: '',
}

vi.mock('ora', () => ({
  default: vi.fn(() => mockSpinner),
}))

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}

describe('logger', () => {
  let testLogger: Logger

  beforeEach(() => {
    testLogger = new Logger()

    // Reset all mocks including the spinner mock
    vi.clearAllMocks()
    mockSpinner.start.mockReturnThis()
    mockSpinner.succeed.mockReturnThis()
    mockSpinner.fail.mockReturnThis()
    mockSpinner.stop.mockReturnThis()

    // Mock console methods
    globalThis.console = mockConsole as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic logging methods', () => {
    it('should log info messages with blue icon', () => {
      testLogger.info('Test info message')

      expect(mockConsole.log).toHaveBeenCalledWith('blue(ℹ)', 'Test info message')
    })

    it('should log success messages with green icon', () => {
      testLogger.success('Test success message')

      expect(mockConsole.log).toHaveBeenCalledWith('green(✓)', 'Test success message')
    })

    it('should log warning messages with yellow icon', () => {
      testLogger.warn('Test warning message')

      expect(mockConsole.log).toHaveBeenCalledWith('yellow(⚠)', 'Test warning message')
    })

    it('should log error messages with red icon', () => {
      testLogger.error('Test error message')

      expect(mockConsole.log).toHaveBeenCalledWith('red(✗)', 'Test error message')
    })

    it('should log debug messages only in verbose mode', () => {
      // Non-verbose mode (default)
      testLogger.debug('Debug message', false)
      expect(mockConsole.log).not.toHaveBeenCalled()

      // Verbose mode
      testLogger.debug('Debug message', true)
      expect(mockConsole.log).toHaveBeenCalledWith('gray(🐛)', 'gray(Debug message)')
    })
  })

  describe('spinner functionality', () => {
    it('should start spinner with message', () => {
      testLogger.startSpinner('Loading...')

      expect(ora).toHaveBeenCalledWith('Loading...')
      expect(mockSpinner.start).toHaveBeenCalled()
    })

    it('should update spinner message', () => {
      testLogger.startSpinner('Initial message')
      testLogger.updateSpinner('Updated message')

      expect(mockSpinner.text).toBe('Updated message')
    })

    it('should succeed spinner with optional message', () => {
      testLogger.startSpinner('Loading...')
      testLogger.succeedSpinner('Success!')

      expect(mockSpinner.succeed).toHaveBeenCalledWith('Success!')
    })

    it('should succeed spinner without message', () => {
      testLogger.startSpinner('Loading...')
      testLogger.succeedSpinner()

      expect(mockSpinner.succeed).toHaveBeenCalledWith(undefined)
    })

    it('should fail spinner with optional message', () => {
      testLogger.startSpinner('Loading...')
      testLogger.failSpinner('Failed!')

      expect(mockSpinner.fail).toHaveBeenCalledWith('Failed!')
    })

    it('should fail spinner without message', () => {
      testLogger.startSpinner('Loading...')
      testLogger.failSpinner()

      expect(mockSpinner.fail).toHaveBeenCalledWith(undefined)
    })

    it('should stop spinner', () => {
      testLogger.startSpinner('Loading...')
      testLogger.stopSpinner()

      expect(mockSpinner.stop).toHaveBeenCalled()
    })

    it('should handle spinner operations when no spinner is active', () => {
      // These should not throw errors
      expect(() => testLogger.updateSpinner('Test')).not.toThrow()
      expect(() => testLogger.succeedSpinner('Test')).not.toThrow()
      expect(() => testLogger.failSpinner('Test')).not.toThrow()
      expect(() => testLogger.stopSpinner()).not.toThrow()
    })
  })

  describe('formatting methods', () => {
    it('should log new line', () => {
      testLogger.newLine()

      expect(mockConsole.log).toHaveBeenCalledWith()
    })

    it('should log header with formatting', () => {
      testLogger.header('Test Header')

      expect(mockConsole.log).toHaveBeenCalledWith()
      expect(mockConsole.log).toHaveBeenCalledWith('bold.cyan(Test Header)')
      expect(mockConsole.log).toHaveBeenCalledWith('cyan(===========)')
    })

    it('should log subheader with formatting', () => {
      testLogger.subheader('Test Subheader')

      expect(mockConsole.log).toHaveBeenCalledWith()
      expect(mockConsole.log).toHaveBeenCalledWith('bold(Test Subheader)')
      expect(mockConsole.log).toHaveBeenCalledWith('gray(--------------)')
    })

    it('should log list items with proper indentation', () => {
      testLogger.listItem('Item 1')
      testLogger.listItem('Item 2', 1)
      testLogger.listItem('Item 3', 2)

      expect(mockConsole.log).toHaveBeenCalledWith('• Item 1')
      expect(mockConsole.log).toHaveBeenCalledWith('  • Item 2')
      expect(mockConsole.log).toHaveBeenCalledWith('    • Item 3')
    })

    it('should log code blocks with formatting', () => {
      const code = 'const test = "hello"'
      testLogger.code(code)

      expect(mockConsole.log).toHaveBeenCalledWith()
      expect(mockConsole.log).toHaveBeenCalledWith('gray(```)')
      expect(mockConsole.log).toHaveBeenCalledWith('cyan(const test = "hello")')
      expect(mockConsole.log).toHaveBeenCalledWith('gray(```)')
      expect(mockConsole.log).toHaveBeenCalledWith()
    })

    it('should log tables with proper formatting', () => {
      const data = [
        { key: 'Name', value: 'Test Project' },
        { key: 'Version', value: '1.0.0' },
        { key: 'Author', value: 'John Doe' },
      ]

      testLogger.table(data)

      expect(mockConsole.log).toHaveBeenCalledWith('gray(Name   ) : Test Project')
      expect(mockConsole.log).toHaveBeenCalledWith('gray(Version) : 1.0.0')
      expect(mockConsole.log).toHaveBeenCalledWith('gray(Author ) : John Doe')
    })
  })

  describe('singleton logger instance', () => {
    beforeEach(() => {
      // Reset the mock spinner state
      mockSpinner.start.mockClear()
      mockSpinner.succeed.mockClear()
      mockSpinner.fail.mockClear()
      mockSpinner.stop.mockClear()
      vi.mocked(ora).mockClear()
    })

    it('should export a singleton logger instance', () => {
      expect(logger).toBeInstanceOf(Logger)
    })

    it('should maintain state across calls', () => {
      testLogger.startSpinner('Test')
      testLogger.succeedSpinner('Done')

      expect(ora).toHaveBeenCalledWith('Test')
      expect(mockSpinner.start).toHaveBeenCalled()
      expect(mockSpinner.succeed).toHaveBeenCalledWith('Done')
    })
  })

  describe('edge cases', () => {
    it('should handle empty messages', () => {
      expect(() => testLogger.info('')).not.toThrow()
      expect(() => testLogger.success('')).not.toThrow()
      expect(() => testLogger.warn('')).not.toThrow()
      expect(() => testLogger.error('')).not.toThrow()
    })

    it('should handle special characters in messages', () => {
      const specialMessage = 'Test with émojis 🚀 and spëcial chars!'

      expect(() => testLogger.info(specialMessage)).not.toThrow()
      expect(mockConsole.log).toHaveBeenCalledWith('blue(ℹ)', specialMessage)
    })

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(1000)

      expect(() => testLogger.info(longMessage)).not.toThrow()
      expect(mockConsole.log).toHaveBeenCalledWith('blue(ℹ)', longMessage)
    })
  })
})
