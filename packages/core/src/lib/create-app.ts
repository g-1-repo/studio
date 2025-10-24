import type { Schema } from 'hono'

import type { AppBindings, AppOpenAPI } from './types'
import { OpenAPIHono } from '@hono/zod-openapi'

// Core framework function to create a router
export function createRouter<S extends Schema = Schema>(): AppOpenAPI<S> {
  return new OpenAPIHono<AppBindings, S>({
    strict: false,
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: result.error.flatten(),
          },
          422,
        )
      }
    },
  })
}



