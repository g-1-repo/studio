import { openApiPlugin } from './openapi.plugin.js'
import { securityPlugin } from './security.plugin.js'
import { rateLimitPlugin } from './rate-limit.plugin.js'
import { loggerPlugin } from './logger.plugin.js'
import { corsPlugin } from './cors.plugin.js'
import { validationPlugin } from './validation.plugin.js'

export { 
  openApiPlugin,
  securityPlugin,
  rateLimitPlugin,
  loggerPlugin,
  corsPlugin,
  validationPlugin
}

export const builtinPlugins = [
  openApiPlugin,
  securityPlugin,
  rateLimitPlugin,
  loggerPlugin,
  corsPlugin,
  validationPlugin
]