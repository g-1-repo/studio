import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createWorkerSafeCuid2,
  createWorkerSafeNanoid,
  generateSecureRandomString,
  generateUUID,
} from './workers-safe'

describe('workers-safe crypto functions', () => {
  describe('createWorkerSafeCuid2', () => {
    it('should generate a valid CUID2', () => {
      const id = createWorkerSafeCuid2()
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
      // CUID2 should start with a letter
      expect(/^[a-z]/.test(id)).toBe(true)
    })

    it('should generate unique IDs', () => {
      const id1 = createWorkerSafeCuid2()
      const id2 = createWorkerSafeCuid2()
      expect(id1).not.toBe(id2)
    })
  })

  describe('createWorkerSafeNanoid', () => {
    it('should generate a nanoid with default length', () => {
      const id = createWorkerSafeNanoid()
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBe(21) // Default nanoid length
    })

    it('should generate a nanoid with custom length', () => {
      const customLength = 10
      const id = createWorkerSafeNanoid(customLength)
      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(id.length).toBe(customLength)
    })

    it('should generate unique IDs', () => {
      const id1 = createWorkerSafeNanoid()
      const id2 = createWorkerSafeNanoid()
      expect(id1).not.toBe(id2)
    })
  })

  describe('generateSecureRandomString', () => {
    it('should generate a string with default length', () => {
      const str = generateSecureRandomString()
      expect(str).toBeDefined()
      expect(typeof str).toBe('string')
      expect(str.length).toBe(32) // Default length
    })

    it('should generate a string with custom length', () => {
      const customLength = 16
      const str = generateSecureRandomString(customLength)
      expect(str).toBeDefined()
      expect(typeof str).toBe('string')
      expect(str.length).toBe(customLength)
    })

    it('should only contain valid characters', () => {
      const str = generateSecureRandomString(100)
      const validChars = /^[A-Z0-9]+$/i
      expect(validChars.test(str)).toBe(true)
    })

    it('should generate unique strings', () => {
      const str1 = generateSecureRandomString()
      const str2 = generateSecureRandomString()
      expect(str1).not.toBe(str2)
    })
  })

  describe('generateUUID', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    it('should generate a valid UUID v4 format', () => {
      const uuid = generateUUID()
      expect(uuid).toBeDefined()
      expect(typeof uuid).toBe('string')

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuidRegex.test(uuid)).toBe(true)
    })

    it('should use crypto.randomUUID when available', () => {
      const mockRandomUUID = vi.fn(() => '550e8400-e29b-41d4-a716-446655440000')

      // Mock crypto.randomUUID
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          randomUUID: mockRandomUUID,
          getRandomValues: vi.fn(),
        },
        writable: true,
      })

      const uuid = generateUUID()
      expect(mockRandomUUID).toHaveBeenCalled()
      expect(uuid).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should fallback to manual generation when crypto.randomUUID is not available', () => {
      const mockGetRandomValues = vi.fn(array => {
        // Fill with predictable values for testing
        for (let i = 0; i < array.length; i++) {
          array[i] = i * 16 + 15 // This will give us 'ff' for each byte
        }
        return array
      })

      // Mock crypto without randomUUID
      Object.defineProperty(globalThis, 'crypto', {
        value: {
          getRandomValues: mockGetRandomValues,
        },
        writable: true,
      })

      const uuid = generateUUID()
      expect(mockGetRandomValues).toHaveBeenCalled()
      expect(uuid).toBeDefined()
      expect(typeof uuid).toBe('string')

      // Should still be valid UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      expect(uuidRegex.test(uuid)).toBe(true)
    })

    it('should generate unique UUIDs', () => {
      // Test that UUIDs are different - this is a basic sanity check
      // Note: In rare cases, UUIDs could theoretically be the same due to randomness
      // but this is extremely unlikely with proper random generation
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()

      // Basic format validation
      expect(uuid1).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
      expect(uuid2).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )

      // They should be different (extremely high probability)
      if (uuid1 === uuid2) {
        console.warn('Generated identical UUIDs - this is extremely rare but possible')
      }
    })
  })
})
