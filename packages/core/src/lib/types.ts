import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { Schema } from 'hono'
import type { PinoLogger } from 'hono-pino'

import type { auth, createAuth } from '../auth'
import type { Environment } from '../env'

export interface AppBindings {
  Bindings: Environment
  Variables: {
    logger: PinoLogger
    requestId: string
    auth: ReturnType<typeof createAuth>
    user: any | null
    session: any | null
  }
};

// eslint-disable-next-line ts/no-empty-object-type
export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>
