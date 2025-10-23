import type { NotFoundHandler } from 'hono'

import { HTTP_STATUS_PHRASES, NOT_FOUND } from '@/lib/utils/http-status'

const notFound: NotFoundHandler = (c) => {
  return c.json({
    message: `${HTTP_STATUS_PHRASES.NOT_FOUND} - ${c.req.path}`,
  }, NOT_FOUND)
}

export default notFound
