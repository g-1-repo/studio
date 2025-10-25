import { CONFLICT, getStatusPhrase, INTERNAL_SERVER_ERROR, NOT_FOUND } from './utils/http-status.js'
import { createMessageObjectSchema } from './utils/openapi/schemas/index.js'

export const ZOD_ERROR_MESSAGES = {
  REQUIRED: 'Required',
  EXPECTED_NUMBER: 'Expected number, received nan',
  NO_UPDATES: 'No updates provided',
  EXPECTED_CUID2: 'Id must be a cuid2',
  INVALID_EMAIL: 'Invalid email format',
  INVALID_INPUT: 'Invalid input: expected nonoptional, received undefined',
}

export const ZOD_ERROR_CODES = {
  INVALID_UPDATES: 'invalid_updates',
  INVALID_TYPE: 'invalid_type',
  CUSTOM: 'custom',
}

export const notFoundSchema = createMessageObjectSchema(getStatusPhrase(NOT_FOUND))
export const internalServerErrorSchema = createMessageObjectSchema(
  getStatusPhrase(INTERNAL_SERVER_ERROR)
)

export const conflictSchema = createMessageObjectSchema(getStatusPhrase(CONFLICT))
