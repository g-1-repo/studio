import {
  normalizeEmail,
  validateAndNormalizeEmail,
  validatePagination,
  validateRequired as validateRequiredFields,
} from '@g-1/util/validation'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'

/**
 * Base service class for business logic layer
 *
 * Features:
 * - Standardized error handling
 * - Input validation helpers
 * - Business logic abstraction
 * - Cross-cutting concerns (logging, metrics)
 */
export abstract class BaseService {
  /**
   * Validate required fields in input data
   */
  protected validateRequired<T extends Record<string, unknown>>(
    data: T,
    requiredFields: (keyof T)[],
  ): void {
    const validation = validateRequiredFields(data, requiredFields)

    if (!validation.isValid) {
      throw new ValidationError(
        `Missing required fields: ${validation.missingFields.join(', ')}`,
        { missingFields: validation.missingFields },
      )
    }
  }

  /**
   * Validate email format
   */
  protected validateEmail(email: string): void {
    const validation = validateAndNormalizeEmail(email)
    if (!validation.isValid) {
      throw new ValidationError(validation.error || 'Invalid email format', { email })
    }
  }

  /**
   * Normalize email address (lowercase, trim)
   */
  protected normalizeEmail(email: string): string {
    return normalizeEmail(email)
  }

  /**
   * Validate and normalize input data
   */
  protected validateAndNormalize<T extends { email?: string }>(data: T): T {
    if (data.email) {
      const validation = validateAndNormalizeEmail(data.email)
      if (!validation.isValid) {
        throw new ValidationError(validation.error || 'Invalid email format', { email: data.email })
      }
      data.email = validation.normalizedEmail
    }
    return data
  }

  /**
   * Check if resource exists and throw error if not found
   */
  protected ensureExists<T>(
    resource: T | null | undefined,
    resourceName: string,
    identifier?: string,
  ): T {
    if (resource === null || resource === undefined) {
      throw new NotFoundError(resourceName, identifier)
    }
    return resource
  }

  /**
   * Check if resource doesn't exist and throw conflict error if it does
   */
  protected ensureNotExists<T>(
    resource: T | null | undefined,
    conflictMessage: string,
    details?: unknown,
  ): void {
    if (resource !== null && resource !== undefined) {
      throw new ConflictError(conflictMessage, details)
    }
  }

  /**
   * Execute operation with logging and error handling
   */
  protected async executeOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const startTime = Date.now()

    try {
      const result = await operation()
      const duration = Date.now() - startTime

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow service operation: ${operationName} took ${duration}ms`)
      }

      return result
    }
    catch (error) {
      const duration = Date.now() - startTime
      console.error(`Service operation failed: ${operationName}`, {
        error: error instanceof Error ? error.message : String(error),
        duration,
      })
      throw error
    }
  }

  /**
   * Pagination helper
   */
  protected validatePagination(page: number, limit: number): { page: number, limit: number } {
    return validatePagination(page, limit, 100) // Max 100 items per page
  }
}
