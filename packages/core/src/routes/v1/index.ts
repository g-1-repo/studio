import { createRouter } from '@/lib/create-app'
import authDocs from './auth-docs.route'
import earlyAccessRequests from './early-access-requests/early-access-requests.index'
import index from './index.route'

const v1Router = createRouter()

// Mount all v1 routes
v1Router.route('/', index)
v1Router.route('/', authDocs)
v1Router.route('/', earlyAccessRequests)

export default v1Router
