import { openApiPlugin } from './openapi.plugin.js'

export { openApiPlugin }

// Export all built-in plugins as an array for easy registration
export const builtinPlugins = [
  openApiPlugin
]