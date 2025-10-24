/**
 * @fileoverview G1 Studio API Framework - Core Runtime
 * @package @g-1/core
 * @version 1.15.8
 * @description A plugin-first, high-performance TypeScript API framework built on Hono for Cloudflare Workers
 */

// Core framework exports
export { default as configureOpenAPI } from './lib/configure-open-api'
export { createRouter } from './lib/create-app'
export type { AppBindings, AppOpenAPI, AppRouteHandler } from './lib/types'

// Middleware exports
export {
    enhancedSecurityHeaders,
    inputSanitization, notFound,
    onError, rateLimitOptimized,
    requestValidation,
    securityAuditLog,
    simpleRateLimit
} from './middleware'

// Utility exports
export * from './lib/constants'
export * from './lib/errors'
export * from './lib/utils/crypto'
export * from './lib/utils/drizzle'
export * from './lib/utils/http-status'
export * from './lib/utils/openapi'
export * from './lib/utils/types'

// OpenAPI schema and helper exports
export { 
    createErrorSchema, 
    createMessageObjectSchema, 
    cuid2ParamsSchema 
} from './lib/utils/openapi/schemas'
export { 
    jsonContent, 
    jsonContentRequired, 
    jsonContentOneOf 
} from './lib/utils/openapi/helpers'

// Export specific items from exceptions to avoid conflicts
export {
    BadRequest, Conflict, createBadRequest, createConflict, createForbidden, createInternalError, createNotFound, createServiceUnavailable, createTooManyRequests, createUnauthorized, Forbidden, InternalError, NotFound, TooManyRequests, Unauthorized
} from './lib/utils/exceptions'

// Base classes for services and repositories
export { BaseRepository } from './lib/base-repository'
export { BaseService } from './lib/base-service'

