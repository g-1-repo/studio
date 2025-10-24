import { getCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory'
import type { Context, Next, MiddlewareHandler } from 'hono'
import type { AppBindings } from '@g-1/core'
import { createAuth } from '../auth'

export const authManagement: MiddlewareHandler = createMiddleware(async (c, next) => {
  const auth = createAuth(c.env, (c.req.raw as any).cf || {})
  c.set('auth', auth)
  return await next()
})
