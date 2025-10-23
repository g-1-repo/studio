import { OpenAPIHono } from '@hono/zod-openapi'
import { getExampleHandler, getExampleRoute } from './example'

const v1Router = new OpenAPIHono()

// Mount example route
v1Router.openapi(getExampleRoute, getExampleHandler)

export default v1Router