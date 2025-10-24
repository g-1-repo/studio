import type { AppBindings } from '../lib/types'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../lib/errors'
import { notFound } from './not-found'
import { onError } from './on-error'

describe('middleware', () => {
  let app: Hono<AppBindings>
  let consoleSpy: any

  beforeEach(() => {
    app = new Hono<AppBindings>()
    consoleSpy = {
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('notFound', () => {
    it('should return 404 with proper error structure', async () => {
      app.notFound(notFound)

      const res = await app.request('/non-existent-route')

      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('code', 'NOT_FOUND')
      expect(body.error).toHaveProperty('message')
      expect(body.error.message).toContain('/non-existent-route')
      expect(body.error).toHaveProperty('timestamp')
      expect(new Date(body.error.timestamp)).toBeInstanceOf(Date)
    })

    it('should include the requested path in error message', async () => {
      app.notFound(notFound)

      const res = await app.request('/api/users/123')

      expect(res.status).toBe(404)

      const body = await res.json()
      expect(body.error.message).toContain('/api/users/123')
    })

    it('should return proper content type', async () => {
      app.notFound(notFound)

      const res = await app.request('/test')

      expect(res.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('onError', () => {
    it('should handle AppError instances correctly', async () => {
      app.onError(onError)
      app.get('/test', (_c) => {
        throw new AppError('Test error', 400)
      })

      const res = await app.request('/test')
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('name', 'AppError')
      expect(body.error).toHaveProperty('message', 'Test error')
      expect(body.error).toHaveProperty('statusCode', 400)
      expect(body.error).toHaveProperty('timestamp')
      expect(body.error).toHaveProperty('isOperational', true)
    })

    it('should log operational errors as warnings', async () => {
      const operationalError = new AppError('Operational error', 400)

      app.onError(onError)
      app.get('/test', () => {
        throw operationalError
      })

      await app.request('/test')

      expect(consoleSpy.warn).toHaveBeenCalledWith('Operational error:', expect.any(Object))
    })

    it('should log non-operational errors as errors', async () => {
      const nonOperationalError = new AppError('Non-operational error', 500, false)

      app.onError(onError)
      app.get('/test', () => {
        throw nonOperationalError
      })

      await app.request('/test')

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Non-operational error:',
        'Non-operational error',
        expect.any(String),
      )
    })

    it('should handle HTTPException correctly', async () => {
      app.onError(onError)
      app.get('/test', () => {
        throw new HTTPException(403, { message: 'Forbidden' })
      })

      const res = await app.request('/test')

      expect(res.status).toBe(403)

      const body = await res.json()
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('message', 'Forbidden')
    })

    it('should handle generic errors with 500 status', async () => {
      app.onError(onError)
      app.get('/test', () => {
        throw new Error('Generic error')
      })

      const res = await app.request('/test')

      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body).toHaveProperty('error')
      expect(body.error).toHaveProperty('message', 'Generic error')
      expect(body.error).toHaveProperty('timestamp')
    })

    it('should include stack trace in development environment', async () => {
      const mockEnv = { NODE_ENV: 'development' }

      app.onError(onError)
      app.get('/test', (_c) => {
        throw new Error('Test error')
      })

      const res = await app.request('/test', {}, mockEnv)

      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body.error).toHaveProperty('stack')
    })

    it('should not include stack trace in production environment', async () => {
      const mockEnv = { NODE_ENV: 'production' }

      app.onError(onError)
      app.get('/test', (_c) => {
        throw new Error('Test error')
      })

      const res = await app.request('/test', {}, mockEnv)

      expect(res.status).toBe(500)

      const body = await res.json()
      expect(body.error).not.toHaveProperty('stack')
    })

    it('should log unexpected errors', async () => {
      app.onError(onError)
      app.get('/test', () => {
        throw new Error('Unexpected error')
      })

      await app.request('/test')

      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Unhandled error:',
        'Unexpected error',
        expect.any(String),
      )
    })

    it('should handle errors with custom status codes', async () => {
      const customError = new Error('Custom error')
      ;(customError as any).status = 422

      app.onError(onError)
      app.get('/test', () => {
        throw customError
      })

      const res = await app.request('/test')

      expect(res.status).toBe(422)
    })

    it('should return proper content type', async () => {
      app.onError(onError)
      app.get('/test', () => {
        throw new Error('Test error')
      })

      const res = await app.request('/test')

      expect(res.headers.get('content-type')).toContain('application/json')
    })
  })
})
