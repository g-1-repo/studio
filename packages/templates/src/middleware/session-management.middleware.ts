import type { AppBindings } from '@g-1/core'
import type { MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import type { createAuth } from '../auth'

export const sessionManagement: MiddlewareHandler = createMiddleware<AppBindings>(
  async (c, next) => {
    const auth = c.get('auth') as unknown as ReturnType<typeof createAuth>

    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      })

      if (!session) {
        c.set('user', null)
        c.set('session', null)
        return next()
      }

      // Transform the Better Auth user to match AppBindings user type
      const user = {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role || 'user', // Default to 'user' if role is not set
      }

      c.set('user', user)
      c.set('session', session.session)
      return next()
    } catch {
      // If session retrieval fails, treat as unauthenticated
      c.set('user', null)
      c.set('session', null)
      return next()
    }
  }
)
