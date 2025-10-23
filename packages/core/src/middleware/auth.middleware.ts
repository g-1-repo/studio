import type { MiddlewareHandler } from 'hono'

import { createMiddleware } from 'hono/factory'

import { createAuth } from '@/auth'

export const authManagement: MiddlewareHandler = createMiddleware(async (c, next) => {
  const auth = createAuth(c.env, (c.req.raw as any).cf || {})
  c.set('auth', auth)
  return await next()
})
