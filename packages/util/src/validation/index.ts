import { isArray, isBoolean, isNullish, isNumber, isObject, isString } from '../types'
import { ValidationError } from '../web'

/**
 * Validation result type
 */
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  error?: ValidationError
}

/**
 * Validation rule function type
 */
export type ValidationRule<T = unknown> = (value: T) => boolean | string

/**
 * Validation schema type
 */
export interface ValidationSchema {
  [key: string]: ValidationRule[]
}

/**
 * Create a successful validation result
 */
export function success<T>(data: T): ValidationResult<T> {
  return { success: true, data }
}

/**
 * Create a failed validation result
 */
export function failure(message: string, field?: string, value?: unknown): ValidationResult {
  return { success: false, error: new ValidationError(message, field, value) }
}

/**
 * Required field validation rule
 */
export function required(message: string = 'Field is required'): ValidationRule {
  return (value: unknown) => {
    if (isNullish(value) || (isString(value) && value.trim() === '')) {
      return message
    }
    return true
  }
}

/**
 * String validation rule
 */
export function string(message: string = 'Must be a string'): ValidationRule {
  return (value: unknown) => {
    if (!isNullish(value) && !isString(value)) {
      return message
    }
    return true
  }
}

/**
 * Number validation rule
 */
export function number(message: string = 'Must be a number'): ValidationRule {
  return (value: unknown) => {
    if (!isNullish(value) && !isNumber(value)) {
      return message
    }
    return true
  }
}

/**
 * Boolean validation rule
 */
export function boolean(message: string = 'Must be a boolean'): ValidationRule {
  return (value: unknown) => {
    if (!isNullish(value) && !isBoolean(value)) {
      return message
    }
    return true
  }
}

/**
 * Array validation rule
 */
export function array(message: string = 'Must be an array'): ValidationRule {
  return (value: unknown) => {
    if (!isNullish(value) && !isArray(value)) {
      return message
    }
    return true
  }
}

/**
 * Object validation rule
 */
export function object(message: string = 'Must be an object'): ValidationRule {
  return (value: unknown) => {
    if (!isNullish(value) && !isObject(value)) {
      return message
    }
    return true
  }
}

/**
 * Minimum length validation rule
 */
export function minLength(min: number, message?: string): ValidationRule {
  return (value: unknown) => {
    if (isNullish(value)) return true

    const length = isString(value) || isArray(value) ? value.length : 0
    if (length < min) {
      return message || `Must be at least ${min} characters long`
    }
    return true
  }
}

/**
 * Maximum length validation rule
 */
export function maxLength(max: number, message?: string): ValidationRule {
  return (value: unknown) => {
    if (isNullish(value)) return true

    const length = isString(value) || isArray(value) ? value.length : 0
    if (length > max) {
      return message || `Must be at most ${max} characters long`
    }
    return true
  }
}

/**
 * Minimum value validation rule
 */
export function min(minimum: number, message?: string): ValidationRule {
  return (value: unknown) => {
    if (isNullish(value)) return true

    if (isNumber(value) && value < minimum) {
      return message || `Must be at least ${minimum}`
    }
    return true
  }
}

/**
 * Maximum value validation rule
 */
export function max(maximum: number, message?: string): ValidationRule {
  return (value: unknown) => {
    if (isNullish(value)) return true

    if (isNumber(value) && value > maximum) {
      return message || `Must be at most ${maximum}`
    }
    return true
  }
}

/**
 * Email validation rule
 */
export function email(message: string = 'Must be a valid email address'): ValidationRule {
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return (value: unknown) => {
    if (isNullish(value)) return true

    if (!isString(value) || !emailRegex.test(value)) {
      return message
    }
    return true
  }
}

/**
 * URL validation rule
 */
export function url(message: string = 'Must be a valid URL'): ValidationRule {
  return (value: unknown) => {
    if (isNullish(value)) return true

    if (!isString(value)) {
      return message
    }

    try {
      // eslint-disable-next-line no-new
      new URL(value)
      return true
    } catch {
      return message
    }
  }
}

/**
 * Pattern validation rule
 */
export function pattern(regex: RegExp, message: string = 'Invalid format'): ValidationRule {
  return (value: unknown) => {
    if (isNullish(value)) return true

    if (!isString(value) || !regex.test(value)) {
      return message
    }
    return true
  }
}

/**
 * Custom validation rule
 */
export function custom<T = unknown>(
  validator: (value: T) => boolean,
  message: string = 'Validation failed'
): ValidationRule<T> {
  return (value: T) => {
    if (isNullish(value)) return true

    if (!validator(value)) {
      return message
    }
    return true
  }
}

/**
 * Validate a single value against rules
 */
export function validateValue(
  value: unknown,
  rules: ValidationRule[],
  field?: string
): ValidationResult {
  for (const rule of rules) {
    const result = rule(value)
    if (result !== true) {
      return failure(result as string, field, value)
    }
  }
  return success(value)
}

/**
 * Validate an object against a schema
 */
export function validate(
  data: Record<string, unknown>,
  schema: ValidationSchema
): ValidationResult<Record<string, unknown>> {
  const errors: ValidationError[] = []
  const validatedData: Record<string, unknown> = {}

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    const result = validateValue(value, rules, field)

    if (!result.success && result.error) {
      errors.push(result.error)
    } else {
      validatedData[field] = value
    }
  }

  if (errors.length > 0) {
    const firstError = errors[0]
    return failure(firstError.message, firstError.field, firstError.value) as ValidationResult<
      Record<string, unknown>
    >
  }

  return success(validatedData)
}
