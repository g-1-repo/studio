// Export all template components
export * from './auth'
export * from './db'
export * from './routes'
export * from './middleware'
export * from './services'

// Named exports for convenience
export { default as apiRoutes } from './routes/v1'
export { createDb } from './db'
export { createAuth } from './auth'
export { createMailService } from './services/mail'