import type { AppRouteHandler } from '@g-1/core'
import { getStatusPhrase, NO_CONTENT, NOT_FOUND, OK } from '@g-1/core'
import { EarlyAccessRequestsRepository } from './early-access-requests.repository'
import type { CreateRoute, GetAllRoute, RemoveRoute } from './early-access-requests.routes'
import { EarlyAccessRequestsService } from './early-access-requests-services/early-access-requests.service'

const earlyAccessRequestsRepository = new EarlyAccessRequestsRepository()
const earlyAccessRequestsService = new EarlyAccessRequestsService()

export const getAll: AppRouteHandler<GetAllRoute> = async c => {
  const earlyAccessRequests = await earlyAccessRequestsRepository.getAll(c.env)

  return c.json(earlyAccessRequests, OK)
}

export const create: AppRouteHandler<CreateRoute> = async c => {
  const earlyAccessRequest = c.req.valid('json')
  const earlyAccessRequestResponse = await earlyAccessRequestsService.requestEarlyAccess(
    earlyAccessRequest.email,
    c.env
  )

  return c.json(earlyAccessRequestResponse, OK)
}

export const remove: AppRouteHandler<RemoveRoute> = async c => {
  const { id } = c.req.valid('param')
  const result = await earlyAccessRequestsRepository.remove(id, c.env)
  if (result.meta.changes === 0) {
    return c.json(
      {
        message: getStatusPhrase(NOT_FOUND),
      },
      NOT_FOUND
    )
  }
  return c.body(null, NO_CONTENT)
}
