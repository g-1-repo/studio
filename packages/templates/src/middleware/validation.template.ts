import type { Context, Next } from 'hono'
import { z } from 'zod'

/**
 * Validation middleware templates
 */

export interface ValidationConfig {
  strict?: boolean
  stripUnknown?: boolean
  abortEarly?: boolean
  allowUnknown?: boolean
  customErrorHandler?: (errors: ValidationError[], c: Context) => Response | Promise<Response>
  transformData?: boolean
  validateHeaders?: boolean
  validateQuery?: boolean
  validateParams?: boolean
  validateBody?: boolean
}

export interface ValidationError {
  field: string
  message: string
  value?: any
  code?: string
}

export interface ValidationSchema {
  body?: z.ZodSchema | any
  query?: z.ZodSchema | any
  params?: z.ZodSchema | any
  headers?: z.ZodSchema | any
}

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: Required<Omit<ValidationConfig, 'customErrorHandler'>> = {
  strict: true,
  stripUnknown: false,
  abortEarly: false,
  allowUnknown: false,
  transformData: true,
  validateHeaders: false,
  validateQuery: true,
  validateParams: true,
  validateBody: true,
}

/**
 * Common validation schemas
 */
export const COMMON_SCHEMAS = {
  // Basic types
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  strongPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  // IDs and identifiers
  uuid: z.string().uuid('Invalid UUID format'),
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),

  // Numbers
  positiveInt: z.number().int().positive('Must be a positive integer'),
  nonNegativeInt: z.number().int().min(0, 'Must be non-negative'),

  // Dates
  dateString: z.string().datetime('Invalid date format'),
  futureDate: z
    .string()
    .datetime()
    .refine(date => new Date(date) > new Date(), 'Date must be in the future'),

  // URLs and domains
  url: z.string().url('Invalid URL format'),
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/, 'Invalid domain format'),

  // Phone numbers
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),

  // Common pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),

  // Search and filtering
  search: z.object({
    q: z.string().min(1).max(100).optional(),
    filter: z.string().optional(),
    category: z.string().optional(),
  }),
}

/**
 * Create validation middleware for Zod schemas
 */
export function createZodValidation(schema: ValidationSchema, config: ValidationConfig = {}) {
  const options = { ...DEFAULT_VALIDATION_CONFIG, ...config }

  return async (c: Context, next: Next) => {
    const errors: ValidationError[] = []

    try {
      // Validate request body
      if (options.validateBody && schema.body) {
        const contentType = c.req.header('content-type') || ''
        if (contentType.includes('application/json')) {
          try {
            const body = await c.req.json()
            const result = schema.body.safeParse(body)

            if (!result.success) {
              errors.push(...formatZodErrors(result.error, 'body'))
            } else if (options.transformData) {
              c.set('validatedBody', result.data)
            }
          } catch (_error) {
            errors.push({
              field: 'body',
              message: 'Invalid JSON format',
              code: 'INVALID_JSON',
            })
          }
        }
      }

      // Validate query parameters
      if (options.validateQuery && schema.query) {
        const query = Object.fromEntries(new URL(c.req.url).searchParams.entries())
        const result = schema.query.safeParse(query)

        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'query'))
        } else if (options.transformData) {
          c.set('validatedQuery', result.data)
        }
      }

      // Validate path parameters
      if (options.validateParams && schema.params) {
        const params = c.req.param()
        const result = schema.params.safeParse(params)

        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'params'))
        } else if (options.transformData) {
          c.set('validatedParams', result.data)
        }
      }

      // Validate headers
      if (options.validateHeaders && schema.headers) {
        const headers = Object.fromEntries(c.req.raw.headers.entries())
        const result = schema.headers.safeParse(headers)

        if (!result.success) {
          errors.push(...formatZodErrors(result.error, 'headers'))
        } else if (options.transformData) {
          c.set('validatedHeaders', result.data)
        }
      }

      // Handle validation errors
      if (errors.length > 0) {
        if (options.customErrorHandler) {
          return await options.customErrorHandler(errors, c)
        }

        return c.json(
          {
            error: 'Validation failed',
            details: errors,
          },
          400
        )
      }

      await next()
    } catch (error) {
      if (options.customErrorHandler) {
        return await options.customErrorHandler(
          [
            {
              field: 'unknown',
              message: 'Validation error occurred',
              code: 'VALIDATION_ERROR',
            },
          ],
          c
        )
      }

      return c.json(
        {
          error: 'Validation error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
}

/**
 * Format Zod validation errors
 */
function formatZodErrors(error: z.ZodError, prefix: string = ''): ValidationError[] {
  return error.issues.map((err: any) => ({
    field: prefix ? `${prefix}.${err.path.join('.')}` : err.path.join('.'),
    message: err.message,
    value: err.input,
    code: err.code,
  }))
}

/**
 * Create custom validation middleware
 */
export function createCustomValidation(
  validators: {
    [key: string]: (value: any, c: Context) => Promise<boolean> | boolean
  },
  config: ValidationConfig = {}
) {
  const options = { ...DEFAULT_VALIDATION_CONFIG, ...config }

  return async (c: Context, next: Next) => {
    const errors: ValidationError[] = []

    try {
      for (const [field, validator] of Object.entries(validators)) {
        let value: any

        // Extract value based on field location
        if (field.startsWith('body.')) {
          const body = await c.req.json().catch(() => ({}))
          value = getNestedValue(body, field.substring(5))
        } else if (field.startsWith('query.')) {
          const query = Object.fromEntries(new URL(c.req.url).searchParams.entries())
          value = getNestedValue(query, field.substring(6))
        } else if (field.startsWith('params.')) {
          const params = c.req.param()
          value = getNestedValue(params, field.substring(7))
        } else if (field.startsWith('headers.')) {
          const headers = Object.fromEntries(c.req.raw.headers.entries())
          value = getNestedValue(headers, field.substring(8))
        }

        const isValid = await validator(value, c)
        if (!isValid) {
          errors.push({
            field,
            message: `Validation failed for ${field}`,
            value,
            code: 'CUSTOM_VALIDATION_FAILED',
          })
        }
      }

      if (errors.length > 0) {
        if (options.customErrorHandler) {
          return await options.customErrorHandler(errors, c)
        }

        return c.json(
          {
            error: 'Validation failed',
            details: errors,
          },
          400
        )
      }

      await next()
    } catch (error) {
      return c.json(
        {
          error: 'Validation error',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        500
      )
    }
  }
}

/**
 * Get nested value from object
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Predefined validation middleware
 */
export const VALIDATION_MIDDLEWARE = {
  /**
   * User registration validation
   */
  userRegistration: () =>
    createZodValidation({
      body: z.object({
        email: COMMON_SCHEMAS.email,
        password: COMMON_SCHEMAS.strongPassword,
        firstName: z.string().min(1, 'First name is required').max(50),
        lastName: z.string().min(1, 'Last name is required').max(50),
        dateOfBirth: z.string().datetime().optional(),
        phoneNumber: COMMON_SCHEMAS.phoneNumber.optional(),
        acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms'),
      }),
    }),

  /**
   * User login validation
   */
  userLogin: () =>
    createZodValidation({
      body: z.object({
        email: COMMON_SCHEMAS.email,
        password: z.string().min(1, 'Password is required'),
        rememberMe: z.boolean().optional(),
      }),
    }),

  /**
   * Password reset validation
   */
  passwordReset: () =>
    createZodValidation({
      body: z.object({
        email: COMMON_SCHEMAS.email,
      }),
    }),

  /**
   * Password update validation
   */
  passwordUpdate: () =>
    createZodValidation({
      body: z
        .object({
          currentPassword: z.string().min(1, 'Current password is required'),
          newPassword: COMMON_SCHEMAS.strongPassword,
          confirmPassword: z.string(),
        })
        .refine(data => data.newPassword === data.confirmPassword, {
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        }),
    }),

  /**
   * Profile update validation
   */
  profileUpdate: () =>
    createZodValidation({
      body: z.object({
        firstName: z.string().min(1).max(50).optional(),
        lastName: z.string().min(1).max(50).optional(),
        bio: z.string().max(500).optional(),
        website: COMMON_SCHEMAS.url.optional(),
        location: z.string().max(100).optional(),
        phoneNumber: COMMON_SCHEMAS.phoneNumber.optional(),
      }),
    }),

  /**
   * Pagination validation
   */
  pagination: () =>
    createZodValidation({
      query: COMMON_SCHEMAS.pagination,
    }),

  /**
   * Search validation
   */
  search: () =>
    createZodValidation({
      query: COMMON_SCHEMAS.search,
    }),

  /**
   * ID parameter validation
   */
  idParam: () =>
    createZodValidation({
      params: z.object({
        id: COMMON_SCHEMAS.uuid,
      }),
    }),

  /**
   * Slug parameter validation
   */
  slugParam: () =>
    createZodValidation({
      params: z.object({
        slug: COMMON_SCHEMAS.slug,
      }),
    }),

  /**
   * File upload validation
   */
  fileUpload: (maxSize: number = 5 * 1024 * 1024, allowedTypes: string[] = []) =>
    createCustomValidation({
      'body.file': async (file: File) => {
        if (!file) return false
        if (file.size > maxSize) return false
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) return false
        return true
      },
    }),

  /**
   * API key validation
   */
  apiKey: () =>
    createZodValidation({
      headers: z.object({
        'x-api-key': z.string().min(1, 'API key is required'),
      }),
    }),

  /**
   * Content type validation
   */
  jsonContentType: () =>
    createCustomValidation({
      'headers.content-type': (contentType: string) => {
        return contentType?.includes('application/json') || false
      },
    }),
}

/**
 * Validation helpers
 */
export const VALIDATION_HELPERS = {
  /**
   * Create conditional validation
   */
  conditional: (
    condition: (c: Context) => boolean,
    schema: ValidationSchema,
    config?: ValidationConfig
  ) => {
    return async (c: Context, next: Next) => {
      if (condition(c)) {
        return createZodValidation(schema, config)(c, next)
      }
      await next()
    }
  },

  /**
   * Combine multiple validations
   */
  combine: (...middlewares: Array<(c: Context, next: Next) => Promise<void>>) => {
    return async (c: Context, next: Next) => {
      for (const middleware of middlewares) {
        await middleware(c, async () => {})
      }
      await next()
    }
  },

  /**
   * Create async validation
   */
  async: (
    asyncValidators: {
      [key: string]: (value: any, c: Context) => Promise<boolean>
    },
    config?: ValidationConfig
  ) => {
    return createCustomValidation(asyncValidators, config)
  },
}

/**
 * Usage examples
 */
export const VALIDATION_EXAMPLES = {
  basic: `// Basic validation setup
import { createZodValidation, COMMON_SCHEMAS } from './validation.template'
import { z } from 'zod'

const app = new Hono()

// User creation endpoint
app.post('/users', 
  createZodValidation({
    body: z.object({
      email: COMMON_SCHEMAS.email,
      password: COMMON_SCHEMAS.strongPassword,
      name: z.string().min(1).max(100)
    })
  }),
  async (c) => {
    const validatedData = c.get('validatedBody')
    // Use validated data
    return c.json({ success: true })
  }
)`,

  predefined: `// Using predefined validation middleware
import { VALIDATION_MIDDLEWARE } from './validation.template'

const app = new Hono()

// User registration with predefined validation
app.post('/register', 
  VALIDATION_MIDDLEWARE.userRegistration(),
  async (c) => {
    const userData = c.get('validatedBody')
    // Register user
    return c.json({ success: true })
  }
)

// Pagination for list endpoints
app.get('/posts',
  VALIDATION_MIDDLEWARE.pagination(),
  async (c) => {
    const { page, limit, sort, order } = c.get('validatedQuery')
    // Use pagination parameters
    return c.json({ posts: [], page, limit })
  }
)`,

  custom: `// Custom validation with business logic
import { createCustomValidation } from './validation.template'

const app = new Hono()

app.post('/users',
  createCustomValidation({
    'body.email': async (email: string, c: Context) => {
      // Check if email already exists
      const existingUser = await getUserByEmail(email)
      return !existingUser
    },
    'body.username': async (username: string) => {
      // Check username availability
      return await isUsernameAvailable(username)
    }
  }),
  async (c) => {
    // Handle validated request
    return c.json({ success: true })
  }
)`,

  conditional: `// Conditional validation based on user role
import { VALIDATION_HELPERS } from './validation.template'

const app = new Hono()

app.post('/admin/users',
  VALIDATION_HELPERS.conditional(
    (c) => c.get('user')?.role === 'admin',
    {
      body: z.object({
        role: z.enum(['user', 'admin', 'moderator']),
        permissions: z.array(z.string())
      })
    }
  ),
  async (c) => {
    // Handle admin user creation
    return c.json({ success: true })
  }
)`,
}

export default {
  createZodValidation,
  createCustomValidation,
  COMMON_SCHEMAS,
  VALIDATION_MIDDLEWARE,
  VALIDATION_HELPERS,
  DEFAULT_VALIDATION_CONFIG,
}
