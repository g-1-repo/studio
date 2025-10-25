/**
 * @fileoverview G1 Studio API Framework - Core Runtime
 * @package
 * @version 1.15.8
 * @description A plugin-first, high-performance TypeScript API framework built on Hono for Cloudflare Workers
 */

// Base classes for services and repositories
export { BaseRepository } from './lib/base-repository.js'
export { BaseService } from './lib/base-service.js'
// Core framework exports

// Utility exports
export * from './lib/constants.js'

export { createRouter } from './lib/create-app.js'
export * from './lib/errors/index.js'
export type { AppBindings, AppOpenAPI, AppRouteHandler } from './lib/types.js'
export * from './lib/utils/crypto.js'
export * from './lib/utils/drizzle.js'
// Export specific items from exceptions to avoid conflicts
export {
  BadRequest,
  Conflict,
  createBadRequest,
  createConflict,
  createForbidden,
  createInternalError,
  createNotFound,
  createServiceUnavailable,
  createTooManyRequests,
  createUnauthorized,
  Forbidden,
  InternalError,
  NotFound,
  TooManyRequests,
  Unauthorized,
} from './lib/utils/exceptions.js'
export * from './lib/utils/http-status.js'

export * from './lib/utils/openapi/index.js'
export {
  jsonContent,
  jsonContentOneOf,
  jsonContentRequired,
} from './lib/utils/openapi/helpers/index.js'

// OpenAPI schema and helper exports
export {
  createErrorSchema,
  createMessageObjectSchema,
  cuid2ParamsSchema,
} from './lib/utils/openapi/schemas/index.js'

export * from './lib/utils/types.js'
// Middleware exports
export {
  enhancedSecurityHeaders,
  inputSanitization,
  notFound,
  onError,
  rateLimitOptimized,
  requestValidation,
  securityAuditLog,
  simpleRateLimit,
} from './middleware/index.js'

// Plugin system exports
export * from './plugins/index.js'
