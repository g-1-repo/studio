import { createRouter, configureOpenAPI, onError, notFound } from '@g-1/core'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// Create the main application using G1's createRouter
const app = createRouter()

// Configure OpenAPI documentation
configureOpenAPI(app)

// Global middleware
app.use('*', logger())
app.use('*', cors())

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to test-project!',
    timestamp: new Date().toISOString(),
  })
})

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// Error handling
app.onError(onError)
app.notFound(notFound)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
