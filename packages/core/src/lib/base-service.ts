import { ValidationError, ConflictError } from '@g-1/util'
import {
  validate,
  required,
  email as emailRule,
  ValidationResult,
} from '@g-1/util'

import { BaseRepository } from './base-repository'
import { createBadRequest, createConflict } from './utils/exceptions'

export abstract class BaseService {
  constructor(protected repository: BaseRepository) {}

  /**
   * Validate required fields
   */
  protected validateRequiredFields(
    data: Record<string, unknown>,
    requiredFields: string[]
  ): ValidationResult {
    const missingFields = requiredFields.filter(field => {
      const value = data[field]
      return value === undefined || value === null || value === ''
    })
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: new ValidationError(`Missing required fields: ${missingFields.join(', ')}`),
      }
    }
    
    return { success: true, data }
  }

  /**
   * Validate email format
   */
  protected validateEmail(email: string): ValidationResult {
    const schema = { email: [required(), emailRule()] }
    return validate({ email }, schema)
  }

  /**
   * Validate and normalize email
   */
  protected validateAndNormalizeEmail(data: { email: string }): ValidationResult<{ email: string }> {
    const validation = this.validateEmail(data.email)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error
      }
    }
    
    return {
      success: true,
      data: { email: data.email.toLowerCase().trim() }
    }
  }

  /**
   * Validate pagination parameters
   */
  protected validatePagination(params: { page?: number; limit?: number }): ValidationResult {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    
    if (page < 1 || limit < 1 || limit > 100) {
      return {
        success: false,
        error: new ValidationError('Invalid pagination parameters')
      }
    }
    
    return { success: true, data: { page, limit } }
  }

  /**
   * Handle validation errors
   */
  protected handleValidationError(validation: ValidationResult, context?: Record<string, unknown>): never {
    if (validation.error) {
      throw createBadRequest(validation.error.message)
    }
    throw createBadRequest('Validation failed')
  }

  /**
   * Handle conflict errors
   */
  protected handleConflictError(message: string, details?: Record<string, unknown>): never {
    throw createConflict(message)
  }

  /**
   * Ensure entity does not exist (throws conflict if it does)
   */
  protected ensureNotExists<T>(
    entity: T | null | undefined,
    message: string,
    details?: Record<string, unknown>
  ): void {
    if (entity) {
      this.handleConflictError(message, details)
    }
  }

  /**
   * Ensure entity exists (throws not found if it doesn't)
   */
  protected ensureExists<T>(
    entity: T | null | undefined,
    message: string = 'Entity not found'
  ): asserts entity is T {
    if (!entity) {
      throw createBadRequest(message)
    }
  }
}
