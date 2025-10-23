// Example route template for new projects
import { createRoute, z } from '@hono/zod-openapi'
import { BaseService } from '@g-1/core'

// Example service extending BaseService from core
class ExampleService extends BaseService {
  async getExample(id: string) {
    this.validateRequired({ id }, ['id'])
    
    // Your business logic here
    return {
      id,
      message: 'Hello from your new API!',
      timestamp: new Date().toISOString()
    }
  }
}

// Example route definition
export const getExampleRoute = createRoute({
  method: 'get',
  path: '/example/{id}',
  tags: ['Example'],
  summary: 'Get example data',
  request: {
    params: z.object({
      id: z.string().min(1).openapi({ example: '123' })
    })
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.string(),
            message: z.string(),
            timestamp: z.string()
          })
        }
      },
      description: 'Example data retrieved successfully'
    }
  }
})

// Example handler
export async function getExampleHandler(c: any) {
  const { id } = c.req.valid('param')
  const service = new ExampleService()
  
  const result = await service.getExample(id)
  return c.json(result)
}