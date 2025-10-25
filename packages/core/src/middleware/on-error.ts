import process from 'node:process'
import { isOperationalError } from '@g-1/util'
import type { ErrorHandler } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'

import { AppError, getErrorCode, getErrorMessage } from '../lib/errors/index.js'
import { INTERNAL_SERVER_ERROR, OK } from '../lib/utils/http-status.js'

const onError: ErrorHandler = (err, c) => {
  // Use structured error handling
  if (err instanceof AppError) {
    // Log operational errors for monitoring
    if (isOperationalError(err)) {
      console.warn('Operational error:', err.toJSON())
    } else {
      // Non-operational errors are more serious
      console.error('Non-operational error:', err.message, err.stack)
    }

    return c.json(err.toJSON(), err.statusCode as ContentfulStatusCode)
  }

  // Handle legacy errors
  const currentStatus = 'status' in err ? err.status : c.newResponse(null).status
  const statusCode =
    currentStatus !== OK ? (currentStatus as ContentfulStatusCode) : INTERNAL_SERVER_ERROR

  const env = c.env?.NODE_ENV || process.env?.NODE_ENV
  const isDevelopment = env === 'development'

  // Log unexpected errors
  console.error('Unhandled error:', err.message, err.stack)

  return c.json(
    {
      error: {
        code: getErrorCode(err),
        message: getErrorMessage(err),
        timestamp: new Date().toISOString(),
        // Only include stack trace in development
        ...(isDevelopment && { stack: err.stack }),
      },
    },
    statusCode
  )
}

export { onError }

export default onError
