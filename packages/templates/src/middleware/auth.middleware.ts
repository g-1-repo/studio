import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { createAuth } from '../auth'

export const authManagement: MiddlewareHandler = createMiddleware(async (c, next) => {
  const cfProperties = (c.req.raw as { cf?: Record<string, unknown> }).cf || {
    colo: 'unknown',
    edgeRequestKeepAliveStatus: 0,
    httpProtocol: 'HTTP/1.1',
    requestPriority: 'normal',
    tlsVersion: 'TLSv1.3',
    tlsCipher: 'unknown',
  }
  const auth = createAuth(c.env, cfProperties as any)
  c.set('auth', auth)
  return await next()
})
