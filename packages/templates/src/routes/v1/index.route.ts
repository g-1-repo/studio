import { createMessageObjectSchema, createRouter, jsonContent, OK } from '@g-1/core'
import { createRoute } from '@hono/zod-openapi'

const router = createRouter()
  .openapi(
    createRoute({
      tags: ['Index'],
      method: 'get',
      path: '/',
      responses: {
        [OK]: jsonContent(
          createMessageObjectSchema('G1 Api Boilerplate'),
          'G1 Api Boilerplate Index',
        ),
      },
    }),
    (c) => {
      return c.json({
        message: 'G1 Api Boilerplate on Cloudflare',
      }, OK)
    },
  )

export default router
