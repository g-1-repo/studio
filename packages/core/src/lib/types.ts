import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { Schema } from 'hono'
import type { PinoLogger } from 'hono-pino'

import type { createAuth } from '../auth'
import type { Environment } from '../env'

export interface AppBindings {
  Bindings: Environment
  Variables: {
    logger: PinoLogger
    requestId: string
    auth: ReturnType<typeof createAuth>
    user: { id: string; name: string; email: string; role: string } | null
    session: { id: string; token: string; expiresAt: Date; userId: string } | null
  }
}

export type AppOpenAPI<S extends Schema = Record<string, never>> = OpenAPIHono<AppBindings, S>

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>
