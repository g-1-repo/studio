import { apiReference } from '@scalar/hono-api-reference'
import packageJSON from '../../package.json' with { type: 'json' }
import type { AppOpenAPI } from './types.js'

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.1.1',
    info: {
      version: packageJSON.version,
      title: 'G1 Api Boilerplate',
    },
  })

  app.get(
    '/reference',
    apiReference({
      theme: 'kepler',
      pageTitle: 'G1 Api Boilerplate',
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
    })
  )
}
