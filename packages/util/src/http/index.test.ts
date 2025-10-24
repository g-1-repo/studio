import { describe, expect, it } from 'vitest'
import {
  getStatusPhrase,
  HTTP_STATUS,
  HTTP_STATUS_PHRASES,
  isClientError,
  isErrorStatus,
  isServerError,
  isSuccessStatus,
} from './index'

describe('hTTP utilities', () => {
  describe('hTTP_STATUS constants', () => {
    it('should have correct 1xx informational status codes', () => {
      expect(HTTP_STATUS.CONTINUE).toBe(100)
      expect(HTTP_STATUS.SWITCHING_PROTOCOLS).toBe(101)
      expect(HTTP_STATUS.PROCESSING).toBe(102)
      expect(HTTP_STATUS.EARLY_HINTS).toBe(103)
    })

    it('should have correct 2xx success status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200)
      expect(HTTP_STATUS.CREATED).toBe(201)
      expect(HTTP_STATUS.ACCEPTED).toBe(202)
      expect(HTTP_STATUS.NO_CONTENT).toBe(204)
    })

    it('should have correct 3xx redirection status codes', () => {
      expect(HTTP_STATUS.MOVED_PERMANENTLY).toBe(301)
      expect(HTTP_STATUS.FOUND).toBe(302)
      expect(HTTP_STATUS.NOT_MODIFIED).toBe(304)
      expect(HTTP_STATUS.TEMPORARY_REDIRECT).toBe(307)
    })

    it('should have correct 4xx client error status codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400)
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401)
      expect(HTTP_STATUS.FORBIDDEN).toBe(403)
      expect(HTTP_STATUS.NOT_FOUND).toBe(404)
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429)
    })

    it('should have correct 5xx server error status codes', () => {
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500)
      expect(HTTP_STATUS.NOT_IMPLEMENTED).toBe(501)
      expect(HTTP_STATUS.BAD_GATEWAY).toBe(502)
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503)
    })
  })

  describe('hTTP_STATUS_PHRASES', () => {
    it('should have correct phrases for common status codes', () => {
      expect(HTTP_STATUS_PHRASES[200]).toBe('OK')
      expect(HTTP_STATUS_PHRASES[201]).toBe('Created')
      expect(HTTP_STATUS_PHRASES[400]).toBe('Bad Request')
      expect(HTTP_STATUS_PHRASES[401]).toBe('Unauthorized')
      expect(HTTP_STATUS_PHRASES[404]).toBe('Not Found')
      expect(HTTP_STATUS_PHRASES[500]).toBe('Internal Server Error')
    })

    it('should have phrase for teapot status', () => {
      expect(HTTP_STATUS_PHRASES[418]).toBe('I\'m a teapot')
    })

    it('should have phrases for all defined status codes', () => {
      // Test a few key ones from each category
      expect(HTTP_STATUS_PHRASES[100]).toBe('Continue')
      expect(HTTP_STATUS_PHRASES[301]).toBe('Moved Permanently')
      expect(HTTP_STATUS_PHRASES[422]).toBe('Unprocessable Entity')
      expect(HTTP_STATUS_PHRASES[503]).toBe('Service Unavailable')
    })
  })

  describe('getStatusPhrase', () => {
    it('should return correct phrase for known status codes', () => {
      expect(getStatusPhrase(200)).toBe('OK')
      expect(getStatusPhrase(404)).toBe('Not Found')
      expect(getStatusPhrase(500)).toBe('Internal Server Error')
    })

    it('should return "Unknown Status" for unknown status codes', () => {
      expect(getStatusPhrase(999)).toBe('Unknown Status')
      expect(getStatusPhrase(123)).toBe('Unknown Status')
      expect(getStatusPhrase(-1)).toBe('Unknown Status')
    })
  })

  describe('isSuccessStatus', () => {
    it('should return true for 2xx status codes', () => {
      expect(isSuccessStatus(200)).toBe(true)
      expect(isSuccessStatus(201)).toBe(true)
      expect(isSuccessStatus(204)).toBe(true)
      expect(isSuccessStatus(299)).toBe(true)
    })

    it('should return false for non-2xx status codes', () => {
      expect(isSuccessStatus(100)).toBe(false)
      expect(isSuccessStatus(199)).toBe(false)
      expect(isSuccessStatus(300)).toBe(false)
      expect(isSuccessStatus(400)).toBe(false)
      expect(isSuccessStatus(500)).toBe(false)
    })
  })

  describe('isClientError', () => {
    it('should return true for 4xx status codes', () => {
      expect(isClientError(400)).toBe(true)
      expect(isClientError(401)).toBe(true)
      expect(isClientError(404)).toBe(true)
      expect(isClientError(429)).toBe(true)
      expect(isClientError(499)).toBe(true)
    })

    it('should return false for non-4xx status codes', () => {
      expect(isClientError(200)).toBe(false)
      expect(isClientError(300)).toBe(false)
      expect(isClientError(399)).toBe(false)
      expect(isClientError(500)).toBe(false)
    })
  })

  describe('isServerError', () => {
    it('should return true for 5xx status codes', () => {
      expect(isServerError(500)).toBe(true)
      expect(isServerError(501)).toBe(true)
      expect(isServerError(502)).toBe(true)
      expect(isServerError(503)).toBe(true)
      expect(isServerError(599)).toBe(true)
    })

    it('should return false for non-5xx status codes', () => {
      expect(isServerError(200)).toBe(false)
      expect(isServerError(300)).toBe(false)
      expect(isServerError(400)).toBe(false)
      expect(isServerError(499)).toBe(false)
      expect(isServerError(600)).toBe(false)
    })
  })

  describe('isErrorStatus', () => {
    it('should return true for 4xx and 5xx status codes', () => {
      expect(isErrorStatus(400)).toBe(true)
      expect(isErrorStatus(404)).toBe(true)
      expect(isErrorStatus(429)).toBe(true)
      expect(isErrorStatus(500)).toBe(true)
      expect(isErrorStatus(502)).toBe(true)
      expect(isErrorStatus(503)).toBe(true)
    })

    it('should return false for 1xx, 2xx, and 3xx status codes', () => {
      expect(isErrorStatus(100)).toBe(false)
      expect(isErrorStatus(200)).toBe(false)
      expect(isErrorStatus(201)).toBe(false)
      expect(isErrorStatus(300)).toBe(false)
      expect(isErrorStatus(301)).toBe(false)
      expect(isErrorStatus(399)).toBe(false)
    })
  })

  describe('status code ranges', () => {
    it('should correctly categorize edge cases', () => {
      // Edge of 2xx range
      expect(isSuccessStatus(200)).toBe(true)
      expect(isSuccessStatus(299)).toBe(true)
      expect(isSuccessStatus(199)).toBe(false)
      expect(isSuccessStatus(300)).toBe(false)

      // Edge of 4xx range
      expect(isClientError(400)).toBe(true)
      expect(isClientError(499)).toBe(true)
      expect(isClientError(399)).toBe(false)
      expect(isClientError(500)).toBe(false)

      // Edge of 5xx range
      expect(isServerError(500)).toBe(true)
      expect(isServerError(599)).toBe(true)
      expect(isServerError(499)).toBe(false)
      expect(isServerError(600)).toBe(false)
    })
  })
})
