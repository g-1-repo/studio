/**
 * Test suite for error handling components
 */

import { describe, it, expect } from 'vitest'
import { formatError } from '../core/error-formatter.js'
import { createErrorRecovery } from '../core/error-recovery.js'

describe('Error Formatter', () => {
  describe('formatError', () => {
    it('should format basic Error objects', () => {
      const error = new Error('Test error message')
      const formatted = formatError(error)
      
      expect(formatted).toContain('Test error message')
      expect(typeof formatted).toBe('string')
    })

    it('should handle errors with stack traces', () => {
      const error = new Error('Test error')
      error.stack = 'Error: Test error\\n    at test.js:1:1'
      
      const formatted = formatError(error)
      expect(formatted).toContain('Test error')
    })

    it('should handle string errors', () => {
      const formatted = formatError('Simple string error')
      expect(formatted).toContain('Simple string error')
    })

    it('should handle unknown error types', () => {
      const formatted = formatError({ unknown: 'object' })
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })

    it('should handle null and undefined', () => {
      expect(formatError(null)).toBe('Unknown error')
      expect(formatError(undefined)).toBe('Unknown error')
    })
  })
})

describe('Error Recovery', () => {
  describe('createErrorRecovery', () => {
    it('should create error recovery handler', () => {
      const recovery = createErrorRecovery()
      expect(recovery).toBeDefined()
      expect(typeof recovery.handle).toBe('function')
    })

    it('should handle recoverable errors', async () => {
      const recovery = createErrorRecovery()
      
      const mockError = new Error('Recoverable error')
      const result = await recovery.handle(mockError, { 
        retryable: true,
        maxRetries: 1
      })
      
      expect(result).toBeDefined()
    })

    it('should handle non-recoverable errors', async () => {
      const recovery = createErrorRecovery()
      
      const mockError = new Error('Fatal error')
      await expect(
        recovery.handle(mockError, { retryable: false })
      ).rejects.toThrow()
    })
  })

  describe('retry mechanisms', () => {
    it('should retry operations with backoff', async () => {
      const recovery = createErrorRecovery()
      let attempts = 0
      
      const flakyOperation = async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return 'success'
      }
      
      const result = await recovery.withRetry(flakyOperation, {
        maxRetries: 3,
        backoff: 'exponential'
      })
      
      expect(result).toBe('success')
      expect(attempts).toBe(3)
    })

    it('should respect retry limits', async () => {
      const recovery = createErrorRecovery()
      
      const alwaysFailingOperation = async () => {
        throw new Error('Always fails')
      }
      
      await expect(
        recovery.withRetry(alwaysFailingOperation, { maxRetries: 2 })
      ).rejects.toThrow('Always fails')
    })
  })

  describe('user interaction', () => {
    it('should support interactive error recovery', async () => {
      const recovery = createErrorRecovery({ interactive: true })
      
      // Mock user choosing to continue
      recovery.setUserResponse('continue')
      
      const error = new Error('Interactive error')
      const result = await recovery.handleInteractive(error)
      
      expect(result.action).toBe('continue')
    })

    it('should support non-interactive mode', async () => {
      const recovery = createErrorRecovery({ interactive: false })
      
      const error = new Error('Non-interactive error')
      await expect(
        recovery.handleInteractive(error)
      ).rejects.toThrow()
    })
  })
})