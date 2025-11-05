// Export all template components
export { auth as authInstance, createAuth } from './auth'
export * from './db'
export { createDb } from './db'
// Deployment templates
export * from './deployment'
// API documentation templates
export * from './docs'
export * from './middleware'
// Monitoring and logging templates
export * from './monitoring'
export * from './routes'
// Named exports for convenience
export { default as apiRoutes } from './routes/v1'
export * from './services'
export { createMailService } from './services/mail'
