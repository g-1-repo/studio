import type { ZodSchema } from '../helpers/types.ts'

import { z } from '@hono/zod-openapi'

function createErrorSchema<
  T extends ZodSchema,
>(schema: T) {
  const { error } = schema.safeParse(
    schema._def.typeName
    === z.ZodArray
      ? []
      : {},
  )
  return z.object({
    success: z.boolean().openapi({
      example: false,
    }),
    error: z
      .object({
        message: z.array(
          z.object({
            expected: z.string(),
            code: z.string(),
            path: z.array(
              z.union([z.string(), z.number()]),
            ),
            message: z.string().optional(),
          }),
        ),
        name: z.string(),
      })
      .openapi({
        example: error,
      }),
  })
}

export default createErrorSchema
