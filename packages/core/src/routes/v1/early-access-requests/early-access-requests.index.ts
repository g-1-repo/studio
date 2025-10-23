import { createRouter } from '@/lib/create-app'

import * as handlers from './early-access-requests.handlers'
import * as routes from './early-access-requests.routes'

const router = createRouter()
  .openapi(routes.getAll, handlers.getAll)
  .openapi(routes.create, handlers.create)
  .openapi(routes.remove, handlers.remove)

export default router
