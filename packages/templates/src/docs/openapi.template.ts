/**
 * OpenAPI specification generation template for automatic API documentation
 */

export interface OpenAPIConfig {
  title: string
  version: string
  description?: string
  termsOfService?: string
  contact?: {
    name?: string
    url?: string
    email?: string
  }
  license?: {
    name: string
    url?: string
  }
  servers?: Array<{
    url: string
    description?: string
    variables?: Record<string, {
      default: string
      description?: string
      enum?: string[]
    }>
  }>
  externalDocs?: {
    description?: string
    url: string
  }
  security?: Array<Record<string, string[]>>
  tags?: Array<{
    name: string
    description?: string
    externalDocs?: {
      description?: string
      url: string
    }
  }>
}

export interface OpenAPISchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object'
  format?: string
  description?: string
  example?: any
  enum?: any[]
  items?: OpenAPISchema
  properties?: Record<string, OpenAPISchema>
  required?: string[]
  additionalProperties?: boolean | OpenAPISchema
  nullable?: boolean
  readOnly?: boolean
  writeOnly?: boolean
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  $ref?: string
}

export interface OpenAPIParameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  deprecated?: boolean
  allowEmptyValue?: boolean
  style?: 'matrix' | 'label' | 'form' | 'simple' | 'spaceDelimited' | 'pipeDelimited' | 'deepObject'
  explode?: boolean
  allowReserved?: boolean
  schema?: OpenAPISchema
  example?: any
  examples?: Record<string, {
    summary?: string
    description?: string
    value?: any
    externalValue?: string
  }>
}

export interface OpenAPIRequestBody {
  description?: string
  content: Record<string, {
    schema?: OpenAPISchema
    example?: any
    examples?: Record<string, {
      summary?: string
      description?: string
      value?: any
      externalValue?: string
    }>
    encoding?: Record<string, {
      contentType?: string
      headers?: Record<string, OpenAPIParameter>
      style?: string
      explode?: boolean
      allowReserved?: boolean
    }>
  }>
  required?: boolean
}

export interface OpenAPIResponse {
  description: string
  headers?: Record<string, OpenAPIParameter>
  content?: Record<string, {
    schema?: OpenAPISchema
    example?: any
    examples?: Record<string, {
      summary?: string
      description?: string
      value?: any
      externalValue?: string
    }>
  }>
  links?: Record<string, {
    operationRef?: string
    operationId?: string
    parameters?: Record<string, any>
    requestBody?: any
    description?: string
    server?: {
      url: string
      description?: string
      variables?: Record<string, any>
    }
  }>
}

export interface OpenAPIOperation {
  tags?: string[]
  summary?: string
  description?: string
  externalDocs?: {
    description?: string
    url: string
  }
  operationId?: string
  parameters?: OpenAPIParameter[]
  requestBody?: OpenAPIRequestBody
  responses: Record<string, OpenAPIResponse>
  callbacks?: Record<string, any>
  deprecated?: boolean
  security?: Array<Record<string, string[]>>
  servers?: Array<{
    url: string
    description?: string
    variables?: Record<string, any>
  }>
}

export interface OpenAPIPath {
  summary?: string
  description?: string
  get?: OpenAPIOperation
  put?: OpenAPIOperation
  post?: OpenAPIOperation
  delete?: OpenAPIOperation
  options?: OpenAPIOperation
  head?: OpenAPIOperation
  patch?: OpenAPIOperation
  trace?: OpenAPIOperation
  servers?: Array<{
    url: string
    description?: string
    variables?: Record<string, any>
  }>
  parameters?: OpenAPIParameter[]
}

export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
    termsOfService?: string
    contact?: {
      name?: string
      url?: string
      email?: string
    }
    license?: {
      name: string
      url?: string
    }
  }
  servers?: Array<{
    url: string
    description?: string
    variables?: Record<string, any>
  }>
  paths: Record<string, OpenAPIPath>
  components?: {
    schemas?: Record<string, OpenAPISchema>
    responses?: Record<string, OpenAPIResponse>
    parameters?: Record<string, OpenAPIParameter>
    examples?: Record<string, {
      summary?: string
      description?: string
      value?: any
      externalValue?: string
    }>
    requestBodies?: Record<string, OpenAPIRequestBody>
    headers?: Record<string, OpenAPIParameter>
    securitySchemes?: Record<string, {
      type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
      description?: string
      name?: string
      in?: 'query' | 'header' | 'cookie'
      scheme?: string
      bearerFormat?: string
      flows?: {
        implicit?: {
          authorizationUrl: string
          refreshUrl?: string
          scopes: Record<string, string>
        }
        password?: {
          tokenUrl: string
          refreshUrl?: string
          scopes: Record<string, string>
        }
        clientCredentials?: {
          tokenUrl: string
          refreshUrl?: string
          scopes: Record<string, string>
        }
        authorizationCode?: {
          authorizationUrl: string
          tokenUrl: string
          refreshUrl?: string
          scopes: Record<string, string>
        }
      }
      openIdConnectUrl?: string
    }>
    links?: Record<string, any>
    callbacks?: Record<string, any>
  }
  security?: Array<Record<string, string[]>>
  tags?: Array<{
    name: string
    description?: string
    externalDocs?: {
      description?: string
      url: string
    }
  }>
  externalDocs?: {
    description?: string
    url: string
  }
}

export const DEFAULT_OPENAPI_CONFIG: OpenAPIConfig = {
  title: 'API Documentation',
  version: '1.0.0',
  description: 'API documentation generated with OpenAPI 3.0',
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
  ],
}

export class OpenAPIGenerator {
  private config: OpenAPIConfig
  private spec: OpenAPISpec
  private schemas: Map<string, OpenAPISchema> = new Map()

  constructor(config: OpenAPIConfig) {
    this.config = config
    this.spec = {
      openapi: '3.0.3',
      info: {
        title: config.title,
        version: config.version,
        description: config.description,
        termsOfService: config.termsOfService,
        contact: config.contact,
        license: config.license,
      },
      servers: config.servers,
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {},
      },
      security: config.security,
      tags: config.tags,
      externalDocs: config.externalDocs,
    }
  }

  addPath(path: string, pathItem: OpenAPIPath): void {
    this.spec.paths[path] = pathItem
  }

  addSchema(name: string, schema: OpenAPISchema): void {
    if (!this.spec.components) {
      this.spec.components = {}
    }
    if (!this.spec.components.schemas) {
      this.spec.components.schemas = {}
    }
    this.spec.components.schemas[name] = schema
    this.schemas.set(name, schema)
  }

  addSecurityScheme(name: string, scheme: any): void {
    if (!this.spec.components) {
      this.spec.components = {}
    }
    if (!this.spec.components.securitySchemes) {
      this.spec.components.securitySchemes = {}
    }
    this.spec.components.securitySchemes[name] = scheme
  }

  generateFromRoutes(routes: Array<{
    method: string
    path: string
    handler: any
    metadata?: {
      summary?: string
      description?: string
      tags?: string[]
      parameters?: OpenAPIParameter[]
      requestBody?: OpenAPIRequestBody
      responses?: Record<string, OpenAPIResponse>
      security?: Array<Record<string, string[]>>
    }
  }>): void {
    const pathGroups: Record<string, OpenAPIPath> = {}

    routes.forEach(route => {
      const { method, path, metadata } = route
      
      if (!pathGroups[path]) {
        pathGroups[path] = {}
      }

      const operation: OpenAPIOperation = {
        summary: metadata?.summary || `${method.toUpperCase()} ${path}`,
        description: metadata?.description,
        tags: metadata?.tags,
        parameters: metadata?.parameters,
        requestBody: metadata?.requestBody,
        responses: metadata?.responses || {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
        security: metadata?.security,
      }

      pathGroups[path][method.toLowerCase() as keyof OpenAPIPath] = operation as any
    })

    Object.entries(pathGroups).forEach(([path, pathItem]) => {
      this.addPath(path, pathItem)
    })

    // Add common schemas
    this.addCommonSchemas()
  }

  private addCommonSchemas(): void {
    this.addSchema('Error', {
      type: 'object',
      required: ['error', 'message'],
      properties: {
        error: {
          type: 'string',
          description: 'Error code',
          example: 'VALIDATION_ERROR',
        },
        message: {
          type: 'string',
          description: 'Error message',
          example: 'Invalid input data',
        },
        details: {
          type: 'object',
          description: 'Additional error details',
          additionalProperties: true,
        },
      },
    })

    this.addSchema('PaginationMeta', {
      type: 'object',
      required: ['page', 'limit', 'total', 'totalPages'],
      properties: {
        page: {
          type: 'integer',
          minimum: 1,
          description: 'Current page number',
          example: 1,
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          description: 'Number of items per page',
          example: 10,
        },
        total: {
          type: 'integer',
          minimum: 0,
          description: 'Total number of items',
          example: 100,
        },
        totalPages: {
          type: 'integer',
          minimum: 0,
          description: 'Total number of pages',
          example: 10,
        },
      },
    })

    this.addSchema('PaginatedResponse', {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
          },
          description: 'Array of items',
        },
        meta: {
          $ref: '#/components/schemas/PaginationMeta',
        },
      },
    })
  }

  getSpec(): OpenAPISpec {
    return this.spec
  }

  toJSON(): string {
    return JSON.stringify(this.spec, null, 2)
  }

  toYAML(): string {
    // Simple YAML conversion - in a real implementation, use a proper YAML library
    return this.objectToYAML(this.spec, 0)
  }

  private objectToYAML(obj: any, indent: number): string {
    const spaces = '  '.repeat(indent)
    let yaml = ''

    if (Array.isArray(obj)) {
      obj.forEach(item => {
        yaml += `${spaces}- ${this.valueToYAML(item, indent + 1)}\n`
      })
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        yaml += `${spaces}${key}: ${this.valueToYAML(value, indent + 1)}\n`
      })
    } else {
      yaml = String(obj)
    }

    return yaml.trimEnd()
  }

  private valueToYAML(value: any, indent: number): string {
    if (value === null) return 'null'
    if (typeof value === 'boolean') return String(value)
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`
    if (Array.isArray(value) || typeof value === 'object') {
      return '\n' + this.objectToYAML(value, indent)
    }
    return String(value)
  }
}

export function createOpenAPIMiddleware(config: OpenAPIConfig = DEFAULT_OPENAPI_CONFIG) {
  const generator = new OpenAPIGenerator(config)

  return {
    middleware: (c: any, next: any) => next(),
    
    addRoute: (method: string, path: string, metadata?: any) => {
      // This would be called when routes are registered
      // Implementation depends on the routing framework
    },
    
    getSpec: () => generator.getSpec(),
    
    serveSpec: (format: 'json' | 'yaml' = 'json') => {
      return (c: any) => {
        const spec = generator.getSpec()
        
        if (format === 'yaml') {
          c.header('Content-Type', 'application/x-yaml')
          return c.text(generator.toYAML())
        } else {
          c.header('Content-Type', 'application/json')
          return c.json(spec)
        }
      }
    },
  }
}

// Predefined OpenAPI configurations
export const OPENAPI_CONFIGS = {
  basic: {
    title: 'API Documentation',
    version: '1.0.0',
    description: 'Basic API documentation',
    servers: [
      { url: 'http://localhost:3000', description: 'Development server' },
    ],
  } as OpenAPIConfig,
  
  production: {
    title: 'Production API',
    version: '1.0.0',
    description: 'Production API with comprehensive documentation',
    contact: {
      name: 'API Support',
      email: 'support@example.com',
      url: 'https://example.com/support',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
    servers: [
      { url: 'https://api.example.com', description: 'Production server' },
      { url: 'https://staging-api.example.com', description: 'Staging server' },
    ],
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management' },
      { name: 'Admin', description: 'Administrative functions' },
    ],
  } as OpenAPIConfig,
  
  microservice: {
    title: 'Microservice API',
    version: '1.0.0',
    description: 'Microservice API documentation',
    servers: [
      { url: 'http://localhost:3000', description: 'Local development' },
      { url: 'https://service.internal', description: 'Internal service' },
    ],
    security: [{ apiKey: [] }],
  } as OpenAPIConfig,
}

// Common security schemes
export const SECURITY_SCHEMES = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT Bearer token authentication',
  },
  
  apiKey: {
    type: 'apiKey',
    in: 'header',
    name: 'X-API-Key',
    description: 'API key authentication',
  },
  
  oauth2: {
    type: 'oauth2',
    description: 'OAuth2 authentication',
    flows: {
      authorizationCode: {
        authorizationUrl: 'https://example.com/oauth/authorize',
        tokenUrl: 'https://example.com/oauth/token',
        scopes: {
          'read': 'Read access',
          'write': 'Write access',
          'admin': 'Administrative access',
        },
      },
    },
  },
  
  basic: {
    type: 'http',
    scheme: 'basic',
    description: 'Basic HTTP authentication',
  },
}

// Helper functions for creating common schemas
export const SCHEMA_HELPERS = {
  string: (options?: { 
    minLength?: number
    maxLength?: number
    pattern?: string
    format?: string
    enum?: string[]
    example?: string
  }): OpenAPISchema => ({
    type: 'string',
    ...options,
  }),
  
  number: (options?: {
    minimum?: number
    maximum?: number
    format?: 'float' | 'double'
    example?: number
  }): OpenAPISchema => ({
    type: 'number',
    ...options,
  }),
  
  integer: (options?: {
    minimum?: number
    maximum?: number
    format?: 'int32' | 'int64'
    example?: number
  }): OpenAPISchema => ({
    type: 'integer',
    ...options,
  }),
  
  boolean: (example?: boolean): OpenAPISchema => ({
    type: 'boolean',
    example,
  }),
  
  array: (items: OpenAPISchema, options?: {
    minItems?: number
    maxItems?: number
    uniqueItems?: boolean
  }): OpenAPISchema => ({
    type: 'array',
    items,
    ...options,
  }),
  
  object: (properties: Record<string, OpenAPISchema>, required?: string[]): OpenAPISchema => ({
    type: 'object',
    properties,
    required,
  }),
  
  ref: (schemaName: string): OpenAPISchema => ({
    $ref: `#/components/schemas/${schemaName}`,
  }),
  
  pagination: (itemSchema: OpenAPISchema): OpenAPISchema => ({
    type: 'object',
    required: ['data', 'meta'],
    properties: {
      data: {
        type: 'array',
        items: itemSchema,
      },
      meta: {
        $ref: '#/components/schemas/PaginationMeta',
      },
    },
  }),
}

// Usage examples
export const OPENAPI_EXAMPLES = {
  basic: `
import { createOpenAPIMiddleware, OPENAPI_CONFIGS } from './openapi.template'

const app = new Hono()
const openapi = createOpenAPIMiddleware(OPENAPI_CONFIGS.basic)

// Serve OpenAPI spec
app.get('/openapi.json', openapi.serveSpec('json'))
app.get('/openapi.yaml', openapi.serveSpec('yaml'))

// Your API routes...
app.get('/api/users', (c) => {
  return c.json({ users: [] })
})
`,

  withMetadata: `
import { 
  OpenAPIGenerator, 
  OPENAPI_CONFIGS, 
  SCHEMA_HELPERS,
  SECURITY_SCHEMES 
} from './openapi.template'

const generator = new OpenAPIGenerator(OPENAPI_CONFIGS.production)

// Add security schemes
generator.addSecurityScheme('bearerAuth', SECURITY_SCHEMES.bearerAuth)

// Add schemas
generator.addSchema('User', SCHEMA_HELPERS.object({
  id: SCHEMA_HELPERS.string({ format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' }),
  name: SCHEMA_HELPERS.string({ minLength: 1, maxLength: 100, example: 'John Doe' }),
  email: SCHEMA_HELPERS.string({ format: 'email', example: 'john@example.com' }),
  createdAt: SCHEMA_HELPERS.string({ format: 'date-time', example: '2023-01-01T00:00:00Z' }),
}, ['id', 'name', 'email']))

// Generate from routes
generator.generateFromRoutes([
  {
    method: 'GET',
    path: '/api/users',
    handler: () => {},
    metadata: {
      summary: 'Get all users',
      description: 'Retrieve a paginated list of users',
      tags: ['Users'],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: SCHEMA_HELPERS.integer({ minimum: 1, example: 1 }),
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: SCHEMA_HELPERS.integer({ minimum: 1, maximum: 100, example: 10 }),
        },
      ],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: SCHEMA_HELPERS.pagination(SCHEMA_HELPERS.ref('User')),
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
])

const spec = generator.getSpec()
console.log(JSON.stringify(spec, null, 2))
`,

  fullExample: `
import { 
  OpenAPIGenerator,
  OPENAPI_CONFIGS,
  SCHEMA_HELPERS,
  SECURITY_SCHEMES
} from './openapi.template'

// Create generator with custom config
const generator = new OpenAPIGenerator({
  ...OPENAPI_CONFIGS.production,
  title: 'E-commerce API',
  description: 'Comprehensive e-commerce API with user management, products, and orders',
})

// Add security schemes
generator.addSecurityScheme('bearerAuth', SECURITY_SCHEMES.bearerAuth)
generator.addSecurityScheme('apiKey', SECURITY_SCHEMES.apiKey)

// Define schemas
generator.addSchema('Product', SCHEMA_HELPERS.object({
  id: SCHEMA_HELPERS.string({ format: 'uuid' }),
  name: SCHEMA_HELPERS.string({ minLength: 1, maxLength: 200 }),
  description: SCHEMA_HELPERS.string({ maxLength: 1000 }),
  price: SCHEMA_HELPERS.number({ minimum: 0, format: 'float' }),
  category: SCHEMA_HELPERS.string({ enum: ['electronics', 'clothing', 'books'] }),
  inStock: SCHEMA_HELPERS.boolean(),
  tags: SCHEMA_HELPERS.array(SCHEMA_HELPERS.string()),
  createdAt: SCHEMA_HELPERS.string({ format: 'date-time' }),
}, ['id', 'name', 'price', 'category']))

generator.addSchema('CreateProductRequest', SCHEMA_HELPERS.object({
  name: SCHEMA_HELPERS.string({ minLength: 1, maxLength: 200 }),
  description: SCHEMA_HELPERS.string({ maxLength: 1000 }),
  price: SCHEMA_HELPERS.number({ minimum: 0, format: 'float' }),
  category: SCHEMA_HELPERS.string({ enum: ['electronics', 'clothing', 'books'] }),
  tags: SCHEMA_HELPERS.array(SCHEMA_HELPERS.string()),
}, ['name', 'price', 'category']))

// Generate comprehensive API documentation
const routes = [
  {
    method: 'GET',
    path: '/api/products',
    handler: () => {},
    metadata: {
      summary: 'List products',
      description: 'Get a paginated list of products with optional filtering',
      tags: ['Products'],
      parameters: [
        {
          name: 'category',
          in: 'query',
          description: 'Filter by category',
          schema: SCHEMA_HELPERS.string({ enum: ['electronics', 'clothing', 'books'] }),
        },
        {
          name: 'search',
          in: 'query',
          description: 'Search in product names and descriptions',
          schema: SCHEMA_HELPERS.string(),
        },
      ],
      responses: {
        '200': {
          description: 'List of products',
          content: {
            'application/json': {
              schema: SCHEMA_HELPERS.pagination(SCHEMA_HELPERS.ref('Product')),
            },
          },
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/api/products',
    handler: () => {},
    metadata: {
      summary: 'Create product',
      description: 'Create a new product',
      tags: ['Products'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: SCHEMA_HELPERS.ref('CreateProductRequest'),
          },
        },
      },
      responses: {
        '201': {
          description: 'Product created successfully',
          content: {
            'application/json': {
              schema: SCHEMA_HELPERS.ref('Product'),
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  },
]

generator.generateFromRoutes(routes)

// Export the specification
export const apiSpec = generator.getSpec()
export const apiSpecJSON = generator.toJSON()
export const apiSpecYAML = generator.toYAML()
`,
}