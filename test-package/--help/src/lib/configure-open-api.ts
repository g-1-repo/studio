import { apiReference } from '@hono/zod-openapi/api-reference'
import type { OpenAPIHono } from '@hono/zod-openapi'

export default function configureOpenAPI(app: OpenAPIHono) {
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: '--help API'
    }
  })

  app.get('/docs', apiReference({
    theme: 'saturn',
    spec: { url: '/doc' }
  }))
}