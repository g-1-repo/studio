import { apiReference } from '@scalar/hono-api-reference'
import packageJSON from '../../package.json' with { type: 'json' }
import type { AppOpenAPI } from './types'

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.1.1',
    info: {
      version: packageJSON.version || '1.0.0',
      title: 'test-project API',
      description: 'API documentation for test-project',
    },
  })

  app.get(
    '/reference',
    apiReference({
      theme: 'kepler',
      pageTitle: 'test-project API',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
    })
  )
}
