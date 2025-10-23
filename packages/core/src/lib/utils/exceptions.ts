import {
  createBadRequest,
  createConflict,
  createForbidden,
  createInternalError,
  createNotFound,
  createTooManyRequests,
  createUnauthorized,
} from '@g-1/util/web'
import { HTTPException } from 'hono/http-exception'

// Wrapper functions that create Hono HTTPException objects
export function TooManyRequests(message: string = 'Too many requests') {
  const error = createTooManyRequests(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function Forbidden(message: string = 'Forbidden') {
  const error = createForbidden(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function Unauthorized(message: string = 'Unauthorized') {
  const error = createUnauthorized(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function NotFound(message: string = 'Not Found') {
  const error = createNotFound(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function BadRequest(message: string = 'Bad Request') {
  const error = createBadRequest(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function InternalError(message: string = 'Internal Error') {
  const error = createInternalError(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}

export function Conflict(message: string = 'Already exists') {
  const error = createConflict(message)
  return new HTTPException(error.statusCode as any, { message: error.message })
}
