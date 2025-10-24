import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { createRouter, OK, jsonContent, createMessageObjectSchema } from '@g-1/core'

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
