import { z } from '@hono/zod-openapi'

// Regular expression to validate id format: cuid
const ID_ERROR_MESSAGE = 'Id must be a cuid2'

const Cuid2ParamsSchema = z.object({
  id: z
    .cuid2(ID_ERROR_MESSAGE)
    .openapi({
      param: {
        name: 'id',
        in: 'path',
      },
      required: ['id'],
      example: 'cjld2cjxh0000qzrmn831i7rn',
    }),
})

export default Cuid2ParamsSchema
