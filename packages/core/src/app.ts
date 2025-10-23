import process from 'node:process'
import configureOpenAPI from './lib/configure-open-api'
import createApp from './lib/create-app'
import v1Router from './routes/v1'

const app = createApp()

// Gate API docs in production unless explicitly enabled
if (process.env.API_DOCS_ENABLED === 'true' || process.env.NODE_ENV !== 'production')
  configureOpenAPI(app)

// Mount versioned API routes
app.route('/v1', v1Router)

export type AppType = typeof v1Router

export default app
