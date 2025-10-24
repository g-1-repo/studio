import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { AppBindings } from '@g-1/core'

export const sessionManagement: MiddlewareHandler = createMiddleware<AppBindings>(async (c, next) => {
  const auth = c.get('auth') as any // Type assertion to bypass TypeScript error
  
  try {
    const session = await auth.api.getSession({ 
      headers: c.req.raw.headers 
    })

    if (!session) {
      c.set('user', null)
      c.set('session', null)
      return next()
    }

    c.set('user', session.user)
    c.set('session', session.session)
    return next()
  } catch (error) {
    // If session retrieval fails, treat as unauthenticated
    c.set('user', null)
    c.set('session', null)
    return next()
  }
})
