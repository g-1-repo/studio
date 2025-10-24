import { HTTP_STATUS, HTTP_STATUS_PHRASES } from '@g-1/util'
import type { NotFoundHandler } from 'hono'

const notFound: NotFoundHandler = c => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: `${HTTP_STATUS_PHRASES[HTTP_STATUS.NOT_FOUND]} - ${c.req.path}`,
        timestamp: new Date().toISOString(),
      },
    },
    HTTP_STATUS.NOT_FOUND
  )
}

export { notFound }
