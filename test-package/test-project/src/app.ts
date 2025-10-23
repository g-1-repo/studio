import { createApp } from '@g-1/core'
// import { configureOpenAPI } from '@g-1/core'
// import { v1Router } from './routes/v1'

const app = createApp()

// Configure OpenAPI documentation
// if (process.env.API_DOCS_ENABLED === 'true' || process.env.NODE_ENV === 'development') {
//   configureOpenAPI(app)
// }

// Mount versioned routes
// app.route('/v1', v1Router)

export type AppType = typeof app
export default app