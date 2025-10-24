import { createWorkerSafeCuid2 } from '@g-1/util'
import type { MiddlewareHandler } from 'hono'
import type { AppBindings } from '../lib/types'

function pinoLogger() {
  return (async (c, next) => {
    if (c.env.NODE_ENV === 'test') {
      // No logging and avoid importing node-only deps in tests
      return next()
    }

    const { pinoLogger: baseLogger } = await import('hono-pino')
    const { default: pino } = await import('pino')

    if (c.env.NODE_ENV !== 'production') {
      // Development (and other non-production) use pretty printing when available
      const { default: pretty } = await import('pino-pretty')
      const transport =
        typeof pretty === 'function' ? (pretty as unknown as () => unknown)() : undefined
      return baseLogger({
        pino: pino({ level: c.env.LOG_LEVEL || 'info' }, transport),
        http: { reqId: () => createWorkerSafeCuid2() },
      })(c, next)
    }

    // Production: plain pino
    return baseLogger({
      pino: pino({ level: c.env.LOG_LEVEL || 'info' }),
      http: { reqId: () => createWorkerSafeCuid2() },
    })(c, next)
  }) satisfies MiddlewareHandler<AppBindings>
}

export { pinoLogger }
