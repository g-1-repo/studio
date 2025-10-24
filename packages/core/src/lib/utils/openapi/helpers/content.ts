import type { ResponseObject } from 'openapi3-ts/oas30'
import oneOf from './one-of'
import type { ZodSchema } from './types'

/**
 * Create JSON content configuration for OpenAPI
 */
export function jsonContent<T extends ZodSchema>(schema: T, description: string) {
  return {
    content: {
      'application/json': {
        schema,
      },
    },
    description,
  }
}

/**
 * Create required JSON content configuration for OpenAPI
 */
export function jsonContentRequired<T extends ZodSchema>(schema: T, description: string) {
  return {
    ...jsonContent(schema, description),
    required: true,
  }
}

/**
 * Create JSON content with oneOf schema for OpenAPI
 */
export function jsonContentOneOf<T extends ZodSchema>(
  schemas: T[],
  description: string
): ResponseObject {
  return {
    content: {
      'application/json': {
        schema: {
          oneOf: oneOf(schemas),
        },
      },
    },
    description,
  }
}
