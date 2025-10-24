import { ConflictError, ValidationError } from '@g-1/util'
import { beforeEach, describe, expect, it } from 'vitest'
import { BaseRepository } from './base-repository'
import { BaseService } from './base-service'

// Mock BaseRepository
class MockRepository extends BaseRepository {
  // Mock implementation for testing
}

// Test implementation of BaseService
class TestService extends BaseService {
  // Expose protected methods for testing
  testValidateRequiredFields(data: Record<string, unknown>, requiredFields: string[]) {
    return this.validateRequiredFields(data, requiredFields)
  }

  testValidateEmail(email: string) {
    return this.validateEmail(email)
  }

  testValidateAndNormalizeEmail(data: { email: string }) {
    return this.validateAndNormalizeEmail(data)
  }

  testValidatePagination(params: { page?: number; limit?: number }) {
    return this.validatePagination(params)
  }

  testHandleValidationError(validation: any, context?: Record<string, unknown>): never {
    return this.handleValidationError(validation, context)
  }

  testHandleConflictError(message: string, details?: Record<string, unknown>): never {
    return this.handleConflictError(message, details)
  }

  testEnsureNotExists<T>(
    entity: T | null | undefined,
    message: string,
    details?: Record<string, unknown>
  ) {
    return this.ensureNotExists(entity, message, details)
  }

  testEnsureExists<T>(entity: T | null | undefined, message?: string) {
    return this.ensureExists(entity, message)
  }
}

describe('baseService', () => {
  let service: TestService
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = new MockRepository()
    service = new TestService(mockRepository)
  })

  describe('validateRequiredFields', () => {
    it('should pass validation when all required fields are present', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      }
      const requiredFields = ['name', 'email']

      const result = service.testValidateRequiredFields(data, requiredFields)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(data)
    })

    it('should fail validation when required fields are missing', () => {
      const data = {
        name: 'John Doe',
        // email is missing
      }
      const requiredFields = ['name', 'email']

      const result = service.testValidateRequiredFields(data, requiredFields)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
      expect(result.error?.message).toContain('Missing required fields: email')
    })

    it('should fail validation when multiple required fields are missing', () => {
      const data = {
        age: 30,
        // name and email are missing
      }
      const requiredFields = ['name', 'email']

      const result = service.testValidateRequiredFields(data, requiredFields)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
      expect(result.error?.message).toContain('Missing required fields: name, email')
    })

    it('should treat falsy values as missing', () => {
      const data = {
        name: '',
        email: null,
        active: false, // false should be considered valid
      }
      const requiredFields = ['name', 'email', 'active']

      const result = service.testValidateRequiredFields(data, requiredFields)

      expect(result.success).toBe(false)
      expect(result.error?.message).toContain('Missing required fields: name, email')
      expect(result.error?.message).not.toContain('active')
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      const result = service.testValidateEmail('test@example.com')

      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const result = service.testValidateEmail('invalid-email')

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
    })

    it('should reject empty email', () => {
      const result = service.testValidateEmail('')

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
    })

    it('should validate various email formats', () => {
      const validEmails = [
        'user@domain.com',
        'user.name@domain.com',
        'user+tag@domain.co.uk',
        'user123@domain123.org',
      ]

      validEmails.forEach(email => {
        const result = service.testValidateEmail(email)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'plainaddress',
        '@missingdomain.com',
        'missing@.com',
        'spaces @domain.com',
        'double@@domain.com',
      ]

      invalidEmails.forEach(email => {
        const result = service.testValidateEmail(email)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('validateAndNormalizeEmail', () => {
    it('should validate and normalize valid email', () => {
      const data = { email: 'Test@Example.COM' }

      const result = service.testValidateAndNormalizeEmail(data)

      expect(result.success).toBe(true)
      expect(result.data?.email).toBe('test@example.com')
    })

    it('should reject invalid email in normalization', () => {
      const data = { email: 'invalid-email' }

      const result = service.testValidateAndNormalizeEmail(data)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
    })
  })

  describe('validatePagination', () => {
    it('should validate correct pagination parameters', () => {
      const params = { page: 1, limit: 10 }

      const result = service.testValidatePagination(params)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(params)
    })

    it('should use default values for missing parameters', () => {
      const params = {}

      const result = service.testValidatePagination(params)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ page: 1, limit: 20 })
    })

    it('should reject negative page numbers', () => {
      const params = { page: -1, limit: 10 }

      const result = service.testValidatePagination(params)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
    })

    it('should reject zero page numbers', () => {
      const params = { page: 0, limit: 10 }

      const result = service.testValidatePagination(params)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
    })

    it('should reject negative limit', () => {
      const params = { page: 1, limit: -5 }

      const result = service.testValidatePagination(params)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
    })

    it('should reject limit exceeding maximum', () => {
      const params = { page: 1, limit: 1000 }

      const result = service.testValidatePagination(params)

      expect(result.success).toBe(false)
      expect(result.error).toBeInstanceOf(ValidationError)
    })
  })

  describe('handleValidationError', () => {
    it('should throw ValidationError with context', () => {
      const validation = {
        success: false,
        error: new ValidationError('Test validation error'),
      }

      expect(() => service.testHandleValidationError(validation, { field: 'test' })).toThrow(
        ValidationError
      )
    })

    it('should throw ValidationError when no specific error provided', () => {
      const validation = {
        success: false,
      }

      expect(() => service.testHandleValidationError(validation)).toThrow('Validation failed')
    })
  })

  describe('handleConflictError', () => {
    it('should throw ConflictError with details', () => {
      expect(() => service.testHandleConflictError('Resource already exists', { id: 123 })).toThrow(
        ConflictError
      )
    })
  })

  describe('ensureNotExists', () => {
    it('should not throw when entity does not exist', () => {
      const service = new TestService(mockRepository)

      expect(() => service.testEnsureNotExists(null, 'Entity already exists')).not.toThrow()
    })
  })

  describe('ensureExists', () => {
    it('should throw ValidationError when entity does not exist', () => {
      const service = new TestService(mockRepository)

      expect(() => service.testEnsureExists(null)).toThrow(ValidationError)

      expect(() => service.testEnsureExists(undefined)).toThrow(ValidationError)
    })

    it('should throw ValidationError with custom message', () => {
      const service = new TestService(mockRepository)

      expect(() => service.testEnsureExists(undefined, 'Custom not found message')).toThrow(
        'Custom not found message'
      )
    })

    it('should not throw when entity exists', () => {
      const service = new TestService(mockRepository)
      const entity = { id: 1, name: 'test' }

      expect(() => service.testEnsureExists(entity)).not.toThrow()
    })

    it('should assert entity type correctly', () => {
      const entity = { id: '123', name: 'Test' }

      // This should not throw and entity should be properly typed
      service.testEnsureExists(entity)

      // After the assertion, entity should be treated as non-null
      expect(entity.id).toBe('123')
      expect(entity.name).toBe('Test')
    })
  })

  describe('repository Integration', () => {
    it('should have access to repository', () => {
      expect((service as any).repository).toBe(mockRepository)
    })

    it('should be able to use repository in derived classes', () => {
      class UserService extends BaseService {
        async getUser(id: string) {
          // This would typically use this.repository
          return { id, name: 'Test User' }
        }
      }

      const userService = new UserService(mockRepository)
      expect(userService).toBeInstanceOf(BaseService)
    })
  })
})
