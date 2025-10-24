import { createRouter } from '@g-1/core'

import * as handlers from './early-access-requests.handlers'
import * as routes from './early-access-requests.routes'

const router = createRouter()
  .openapi(routes.getAll, handlers.getAll)
  .openapi(routes.create, handlers.create)
  .openapi(routes.remove, handlers.remove)

export default router
