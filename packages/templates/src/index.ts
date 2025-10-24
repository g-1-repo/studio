// Export all template components
export * from './auth'
export { createAuth } from './auth'
export * from './db'
export { createDb } from './db'
export * from './middleware'

export * from './routes'
// Named exports for convenience
export { default as apiRoutes } from './routes/v1'
export * from './services'
export { createMailService } from './services/mail'
