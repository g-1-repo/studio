import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { insertEarlyAccessRequestSchema, selectEarlyAccessRequestsSchema } from '../../../db/schema'
import { conflictSchema, notFoundSchema, CONFLICT, NO_CONTENT, NOT_FOUND, OK, UNPROCESSABLE_ENTITY, jsonContent, jsonContentRequired, createErrorSchema, cuid2ParamsSchema } from '@g-1/core'

const tags = ['Early Access Requests']

export const getAll = createRoute({
  path: '/early-access-requests',
  method: 'get',
  tags,
  responses: {
    [OK]: jsonContent(
      z.array(selectEarlyAccessRequestsSchema),
      'The list of early access requests',
    ),
  },
})

export const create = createRoute({
  path: '/early-access-requests',
  method: 'post',
  tags,
  request: {
    body: jsonContentRequired(
      insertEarlyAccessRequestSchema,
      'The early access request to create',
    ),
  },
  responses: {
    [OK]: jsonContent(
      selectEarlyAccessRequestsSchema,
      'The created early access request',
    ),
    [UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(insertEarlyAccessRequestSchema),
      'The validation error(s)',
    ),
    [CONFLICT]: jsonContent(
      conflictSchema,
      'An early access request with this email already exists.',
    ),
  },
})

export const remove = createRoute({
  path: '/early-access-requests/{id}',
  method: 'delete',
  // middleware: [authState("session")] as const,
  request: {
    params: cuid2ParamsSchema,
  },
  tags,
  responses: {
    [NO_CONTENT]: {
      description: 'Early access request deleted',
    },
    [NOT_FOUND]: jsonContent(
      notFoundSchema,
      'Early access request not found',
    ),
    [UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(cuid2ParamsSchema),
      'Invalid id error',
    ),
  },
})

export type GetAllRoute = typeof getAll
export type CreateRoute = typeof create
export type RemoveRoute = typeof remove
