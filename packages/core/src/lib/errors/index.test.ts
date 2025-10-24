import { describe, expect, it } from 'vitest'
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  // Legacy aliases
  BadRequestError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  getErrorCode,
  getErrorMessage,
  getErrorStatusCode,
  InternalServerError,
  isOperationalError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError,
  TimeoutError,
  ValidationError,
} from './index'

describe('error Exports', () => {
  describe('core Error Classes', () => {
    it('should export AppError class', () => {
      expect(AppError).toBeDefined()
      expect(typeof AppError).toBe('function')

      const error = new AppError('Test error', 500)
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(getErrorCode(error)).toBe('AppError')
    })

    it('should export ValidationError class', () => {
      expect(ValidationError).toBeDefined()
      expect(typeof ValidationError).toBe('function')

      const error = new ValidationError('Validation failed')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe('Validation failed')
      expect(error.statusCode).toBe(400)
    })

    it('should export AuthenticationError class', () => {
      expect(AuthenticationError).toBeDefined()
      expect(typeof AuthenticationError).toBe('function')

      const error = new AuthenticationError('Authentication failed')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.statusCode).toBe(401)
    })

    it('should export AuthorizationError class', () => {
      expect(AuthorizationError).toBeDefined()
      expect(typeof AuthorizationError).toBe('function')

      const error = new AuthorizationError('Authorization failed')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.statusCode).toBe(403)
    })

    it('should export NotFoundError class', () => {
      expect(NotFoundError).toBeDefined()
      expect(typeof NotFoundError).toBe('function')

      const error = new NotFoundError('Resource not found')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.statusCode).toBe(404)
    })

    it('should export ConflictError class', () => {
      expect(ConflictError).toBeDefined()
      expect(typeof ConflictError).toBe('function')

      const error = new ConflictError('Resource conflict')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.statusCode).toBe(409)
    })

    it('should export RateLimitError class', () => {
      expect(RateLimitError).toBeDefined()
      expect(typeof RateLimitError).toBe('function')

      const error = new RateLimitError('Rate limit exceeded')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(RateLimitError)
      expect(error.statusCode).toBe(429)
    })

    it('should export InternalServerError class', () => {
      expect(InternalServerError).toBeDefined()
      expect(typeof InternalServerError).toBe('function')

      const error = new InternalServerError('Internal server error')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(InternalServerError)
      expect(error.statusCode).toBe(500)
    })

    it('should export ServiceUnavailableError class', () => {
      expect(ServiceUnavailableError).toBeDefined()
      expect(typeof ServiceUnavailableError).toBe('function')

      const error = new ServiceUnavailableError('Service unavailable')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error).toBeInstanceOf(ServiceUnavailableError)
      expect(error.statusCode).toBe(503)
    })
  })

  describe('error Utility Functions', () => {
    it('should export getErrorCode function', () => {
      expect(getErrorCode).toBeDefined()
      expect(typeof getErrorCode).toBe('function')

      const appError = new AppError('Test', 400)
      const genericError = new Error('Generic error')

      expect(getErrorCode(appError)).toBe('AppError')
      expect(getErrorCode(genericError)).toBe('INTERNAL_ERROR')
    })

    it('should export getErrorMessage function', () => {
      expect(getErrorMessage).toBeDefined()
      expect(typeof getErrorMessage).toBe('function')

      const error = new Error('Test message')
      expect(getErrorMessage(error)).toBe('Test message')
    })

    it('should export getErrorStatusCode function', () => {
      expect(getErrorStatusCode).toBeDefined()
      expect(typeof getErrorStatusCode).toBe('function')

      const appError = new AppError('Test', 422, 'TEST_CODE')
      const genericError = new Error('Generic error')

      expect(getErrorStatusCode(appError)).toBe(422)
      expect(getErrorStatusCode(genericError)).toBe(500)
    })

    it('should export isOperationalError function', () => {
      expect(isOperationalError).toBeDefined()
      expect(typeof isOperationalError).toBe('function')

      const operationalError = new ValidationError('Validation failed')
      const nonOperationalError = new Error('Generic error')

      expect(isOperationalError(operationalError)).toBe(true)
      expect(isOperationalError(nonOperationalError)).toBe(false)
    })
  })

  describe('legacy Aliases', () => {
    it('should export BadRequestError as alias for ValidationError', () => {
      expect(BadRequestError).toBeDefined()
      expect(BadRequestError).toBe(ValidationError)

      const error = new BadRequestError('Bad request')
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.statusCode).toBe(400)
    })

    it('should export TimeoutError as alias for InternalServerError', () => {
      expect(TimeoutError).toBeDefined()
      expect(TimeoutError).toBe(InternalServerError)

      const error = new TimeoutError('Timeout occurred')
      expect(error).toBeInstanceOf(InternalServerError)
      expect(error.statusCode).toBe(500)
    })

    it('should export NetworkError as alias for InternalServerError', () => {
      expect(NetworkError).toBeDefined()
      expect(NetworkError).toBe(InternalServerError)

      const error = new NetworkError('Network error')
      expect(error).toBeInstanceOf(InternalServerError)
      expect(error.statusCode).toBe(500)
    })

    it('should export DatabaseError as alias for InternalServerError', () => {
      expect(DatabaseError).toBeDefined()
      expect(DatabaseError).toBe(InternalServerError)

      const error = new DatabaseError('Database error')
      expect(error).toBeInstanceOf(InternalServerError)
      expect(error.statusCode).toBe(500)
    })

    it('should export ExternalServiceError as alias for InternalServerError', () => {
      expect(ExternalServiceError).toBeDefined()
      expect(ExternalServiceError).toBe(InternalServerError)

      const error = new ExternalServiceError('External service error')
      expect(error).toBeInstanceOf(InternalServerError)
      expect(error.statusCode).toBe(500)
    })
  })

  describe('error Inheritance Chain', () => {
    it('should maintain proper inheritance chain for all error classes', () => {
      const errors = [
        new ValidationError('Validation error'),
        new AuthenticationError('Auth error'),
        new AuthorizationError('Authz error'),
        new NotFoundError('Not found error'),
        new ConflictError('Conflict error'),
        new RateLimitError('Rate limit error'),
        new InternalServerError('Internal error'),
        new ServiceUnavailableError('Service unavailable error'),
      ]

      errors.forEach(error => {
        expect(error).toBeInstanceOf(Error)
        expect(error).toBeInstanceOf(AppError)
        expect(error.name).toBeDefined()
        expect(error.message).toBeDefined()
        expect(error.statusCode).toBeDefined()
        expect(getErrorCode(error)).toBeDefined()
        expect(typeof error.toJSON).toBe('function')
      })
    })

    it('should have unique error codes for different error types', () => {
      const errors = [
        new ValidationError('Validation error'),
        new AuthenticationError('Auth error'),
        new AuthorizationError('Authz error'),
        new NotFoundError('Not found error'),
        new ConflictError('Conflict error'),
        new RateLimitError('Rate limit error'),
        new InternalServerError('Internal error'),
        new ServiceUnavailableError('Service unavailable error'),
      ]

      const codes = errors.map(error => getErrorCode(error))
      const uniqueCodes = new Set(codes)

      expect(uniqueCodes.size).toBe(codes.length)
    })

    it('should have appropriate status codes for different error types', () => {
      const errorConstructors = {
        ValidationError,
        AuthenticationError,
        AuthorizationError,
        NotFoundError,
        ConflictError,
        RateLimitError,
        InternalServerError,
        ServiceUnavailableError,
      }

      const expectedStatusCodes = {
        ValidationError: 400,
        AuthenticationError: 401,
        AuthorizationError: 403,
        NotFoundError: 404,
        ConflictError: 409,
        RateLimitError: 429,
        InternalServerError: 500,
        ServiceUnavailableError: 503,
      }

      Object.entries(expectedStatusCodes).forEach(([ErrorClass, expectedStatus]) => {
        const ErrorConstructor = errorConstructors[ErrorClass as keyof typeof errorConstructors]
        const error = new ErrorConstructor('Test error')
        expect(error.statusCode).toBe(expectedStatus)
      })
    })
  })
})
