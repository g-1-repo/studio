import type { Context } from 'hono'

export function pinoLogger(_opts?: any) {
  return (c: Context, next: () => Promise<any>) => next()
}
