/**
 * Postman collection template for API testing and documentation
 */

export interface PostmanConfig {
  name: string
  description?: string
  version?: string
  baseUrl?: string
  auth?: {
    type: 'bearer' | 'basic' | 'apikey' | 'oauth2'
    bearer?: {
      token: string
    }
    basic?: {
      username: string
      password: string
    }
    apikey?: {
      key: string
      value: string
      in: 'header' | 'query'
    }
    oauth2?: {
      accessToken: string
      tokenType?: string
    }
  }
  variables?: Array<{
    key: string
    value: string
    type?: 'string' | 'boolean' | 'number'
    description?: string
  }>
  events?: Array<{
    listen: 'prerequest' | 'test'
    script: {
      type: 'text/javascript'
      exec: string[]
    }
  }>
  folders?: string[]
  includeTests?: boolean
  includeExamples?: boolean
  generateEnvironment?: boolean
}

export interface PostmanItem {
  name: string
  request?: {
    method: string
    header: Array<{
      key: string
      value: string
      type?: string
      description?: string
    }>
    url: {
      raw: string
      host: string[]
      path: string[]
      query?: Array<{
        key: string
        value: string
        description?: string
      }>
      variable?: Array<{
        key: string
        value: string
        description?: string
      }>
    }
    body?: {
      mode: 'raw' | 'formdata' | 'urlencoded' | 'binary' | 'graphql'
      raw?: string
      formdata?: Array<{
        key: string
        value: string
        type: 'text' | 'file'
        description?: string
      }>
      urlencoded?: Array<{
        key: string
        value: string
        description?: string
      }>
      options?: {
        raw?: {
          language: 'json' | 'xml' | 'html' | 'text'
        }
      }
    }
    description?: string
  }
  item?: PostmanItem[]
  description?: string
  response?: Array<{
    name: string
    originalRequest: PostmanItem['request']
    status: string
    code: number
    _postman_previewlanguage: string
    header: Array<{
      key: string
      value: string
    }>
    cookie: Array<Record<string, unknown>>
    body: string
  }>
  event?: Array<{
    listen: 'prerequest' | 'test'
    script: {
      type: 'text/javascript'
      exec: string[]
    }
  }>
}

export interface PostmanCollection {
  info: {
    _postman_id: string
    name: string
    description?: string
    version?: string
    schema: string
  }
  item: PostmanItem[]
  auth?: Record<string, unknown>
  event?: Array<{
    listen: 'prerequest' | 'test'
    script: {
      type: 'text/javascript'
      exec: string[]
    }
  }>
  variable?: Array<{
    key: string
    value: string
    type?: string
    description?: string
  }>
}

export interface PostmanEnvironment {
  id: string
  name: string
  values: Array<{
    key: string
    value: string
    type: 'default' | 'secret'
    enabled: boolean
    description?: string
  }>
  _postman_variable_scope: 'environment'
  _postman_exported_at: string
  _postman_exported_using: string
}

export const DEFAULT_POSTMAN_CONFIG: PostmanConfig = {
  name: 'API Collection',
  description: 'Generated API collection for testing',
  version: '1.0.0',
  baseUrl: '{{baseUrl}}',
  includeTests: true,
  includeExamples: true,
  generateEnvironment: true,
  variables: [
    {
      key: 'baseUrl',
      value: 'http://localhost:3000',
      type: 'string',
      description: 'Base URL for the API',
    },
  ],
}

export class PostmanGenerator {
  private config: PostmanConfig
  private collection: PostmanCollection

  constructor(config: PostmanConfig = DEFAULT_POSTMAN_CONFIG) {
    this.config = { ...DEFAULT_POSTMAN_CONFIG, ...config }
    this.collection = this.initializeCollection()
  }

  private initializeCollection(): PostmanCollection {
    return {
      info: {
        _postman_id: this.generateId(),
        name: this.config.name,
        description: this.config.description,
        version: this.config.version,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
      variable: this.config.variables?.map(v => ({
        key: v.key,
        value: v.value,
        type: v.type || 'string',
        description: v.description,
      })),
      event: this.config.events,
    }
  }

  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  addRequest(
    name: string,
    method: string,
    path: string,
    options: {
      description?: string
      headers?: Record<string, string>
      queryParams?: Record<string, string>
      body?: unknown
      folder?: string
      tests?: string[]
      examples?: Array<{
        name: string
        status: number
        body: unknown
        headers?: Record<string, string>
      }>
    } = {}
  ): this {
    const url = this.buildUrl(path, options.queryParams)
    const headers = this.buildHeaders(options.headers)
    const body = this.buildBody(options.body, method)

    const item: PostmanItem = {
      name,
      request: {
        method: method.toUpperCase(),
        header: headers,
        url,
        ...(body && { body }),
        ...(options.description && { description: options.description }),
      },
    }

    // Add tests if enabled
    if (this.config.includeTests && options.tests) {
      item.event = [
        {
          listen: 'test',
          script: {
            type: 'text/javascript',
            exec: options.tests,
          },
        },
      ]
    }

    // Add examples if enabled
    if (this.config.includeExamples && options.examples) {
      item.response = options.examples.map(example => ({
        name: example.name,
        originalRequest: item.request,
        status: `${example.status} ${this.getStatusText(example.status)}`,
        code: example.status,
        _postman_previewlanguage: 'json',
        header: Object.entries(example.headers || {}).map(([key, value]) => ({
          key,
          value,
        })),
        cookie: [],
        body:
          typeof example.body === 'string' ? example.body : JSON.stringify(example.body, null, 2),
      }))
    }

    // Add to folder or root
    if (options.folder) {
      this.addToFolder(options.folder, item)
    } else {
      this.collection.item.push(item)
    }

    return this
  }

  private buildUrl(path: string, queryParams?: Record<string, string>) {
    const baseUrl = this.config.baseUrl || '{{baseUrl}}'
    const fullPath = path.startsWith('/') ? path : `/${path}`

    return {
      raw: `${baseUrl}${fullPath}${queryParams ? this.buildQueryString(queryParams) : ''}`,
      host: baseUrl.includes('{{')
        ? ['{{baseUrl}}']
        : baseUrl.replace(/https?:\/\//, '').split('.'),
      path: fullPath.split('/').filter(Boolean),
      ...(queryParams && {
        query: Object.entries(queryParams).map(([key, value]) => ({
          key,
          value,
          description: `Query parameter: ${key}`,
        })),
      }),
    }
  }

  private buildQueryString(params: Record<string, string>): string {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
    return queryString ? `?${queryString}` : ''
  }

  private buildHeaders(headers?: Record<string, string>) {
    const defaultHeaders = [{ key: 'Content-Type', value: 'application/json', type: 'text' }]

    if (!headers) return defaultHeaders

    const customHeaders = Object.entries(headers).map(([key, value]) => ({
      key,
      value,
      type: 'text',
      description: `Header: ${key}`,
    }))

    return [...defaultHeaders, ...customHeaders]
  }

  private buildBody(body: unknown, method: string) {
    if (!body || ['GET', 'DELETE', 'HEAD'].includes(method.toUpperCase())) {
      return undefined
    }

    if (typeof body === 'string') {
      return {
        mode: 'raw' as const,
        raw: body,
        options: {
          raw: {
            language: 'json' as const,
          },
        },
      }
    }

    return {
      mode: 'raw' as const,
      raw: JSON.stringify(body, null, 2),
      options: {
        raw: {
          language: 'json' as const,
        },
      },
    }
  }

  private addToFolder(folderName: string, item: PostmanItem) {
    let folder = this.collection.item.find(
      (i): i is PostmanItem & { item: PostmanItem[] } => 'item' in i && i.name === folderName
    )

    if (!folder) {
      folder = {
        name: folderName,
        item: [],
        description: `Folder: ${folderName}`,
      }
      this.collection.item.push(folder)
    }

    folder.item.push(item)
  }

  private getStatusText(code: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
    }
    return statusTexts[code] || 'Unknown'
  }

  addFolder(name: string, description?: string): this {
    const folder = {
      name,
      item: [],
      description: description || `Folder: ${name}`,
    }
    this.collection.item.push(folder)
    return this
  }

  addAuth(auth: PostmanConfig['auth']): this {
    if (!auth) return this

    switch (auth.type) {
      case 'bearer':
        this.collection.auth = {
          type: 'bearer',
          bearer: [
            {
              key: 'token',
              value: auth.bearer?.token || '{{authToken}}',
              type: 'string',
            },
          ],
        }
        break
      case 'basic':
        this.collection.auth = {
          type: 'basic',
          basic: [
            {
              key: 'username',
              value: auth.basic?.username || '{{username}}',
              type: 'string',
            },
            {
              key: 'password',
              value: auth.basic?.password || '{{password}}',
              type: 'string',
            },
          ],
        }
        break
      case 'apikey':
        this.collection.auth = {
          type: 'apikey',
          apikey: [
            {
              key: 'key',
              value: auth.apikey?.key || 'X-API-Key',
              type: 'string',
            },
            {
              key: 'value',
              value: auth.apikey?.value || '{{apiKey}}',
              type: 'string',
            },
            {
              key: 'in',
              value: auth.apikey?.in || 'header',
              type: 'string',
            },
          ],
        }
        break
    }

    return this
  }

  generateCollection(): PostmanCollection {
    return this.collection
  }

  generateEnvironment(): PostmanEnvironment {
    const envValues: Array<{
      key: string
      value: string
      type: 'default' | 'secret'
      enabled: boolean
      description?: string
    }> = [
      ...(this.config.variables || []).map(v => ({
        key: v.key,
        value: v.value,
        type: 'default' as const,
        enabled: true,
        description: v.description,
      })),
    ]

    // Add auth-related variables
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'bearer':
          envValues.push({
            key: 'authToken',
            value: this.config.auth.bearer?.token || '',
            type: 'secret' as const,
            enabled: true,
            description: 'Bearer token for authentication',
          })
          break
        case 'basic':
          envValues.push(
            {
              key: 'username',
              value: this.config.auth.basic?.username || '',
              type: 'default' as const,
              enabled: true,
              description: 'Username for basic authentication',
            },
            {
              key: 'password',
              value: this.config.auth.basic?.password || '',
              type: 'secret' as const,
              enabled: true,
              description: 'Password for basic authentication',
            }
          )
          break
        case 'apikey':
          envValues.push({
            key: 'apiKey',
            value: this.config.auth.apikey?.value || '',
            type: 'secret' as const,
            enabled: true,
            description: 'API key for authentication',
          })
          break
      }
    }

    return {
      id: this.generateId(),
      name: `${this.config.name} Environment`,
      values: envValues,
      _postman_variable_scope: 'environment',
      _postman_exported_at: new Date().toISOString(),
      _postman_exported_using: 'API Framework Generator',
    }
  }

  exportCollection(): string {
    return JSON.stringify(this.generateCollection(), null, 2)
  }

  exportEnvironment(): string {
    return JSON.stringify(this.generateEnvironment(), null, 2)
  }
}

// Helper function to create Postman collection from OpenAPI spec
export function createPostmanFromOpenAPI(
  openApiSpec: unknown,
  config: Partial<PostmanConfig> = {}
): PostmanGenerator {
  const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object'
  const spec = isObj(openApiSpec) ? (openApiSpec as Record<string, unknown>) : {}
  const info = isObj(spec.info) ? (spec.info as Record<string, unknown>) : {}
  const servers = Array.isArray(spec.servers) ? (spec.servers as Array<unknown>) : []
  const firstServer =
    servers.length > 0 && isObj(servers[0]) ? (servers[0] as Record<string, unknown>) : undefined

  const fullConfig: PostmanConfig = {
    ...DEFAULT_POSTMAN_CONFIG,
    name: typeof info.title === 'string' ? (info.title as string) : 'API Collection',
    description:
      typeof info.description === 'string'
        ? (info.description as string)
        : 'Generated from OpenAPI specification',
    version: typeof info.version === 'string' ? (info.version as string) : '1.0.0',
    baseUrl:
      typeof firstServer?.url === 'string' ? (firstServer.url as string) : 'http://localhost:3000',
    ...config,
  }

  const generator = new PostmanGenerator(fullConfig)

  // Add authentication if present
  const components = isObj(spec.components)
    ? (spec.components as Record<string, unknown>)
    : undefined
  const securitySchemes =
    components && isObj(components.securitySchemes)
      ? (components.securitySchemes as Record<string, unknown>)
      : undefined

  if (securitySchemes) {
    const schemeValues = Object.values(securitySchemes)
    const firstScheme = schemeValues[0] as unknown
    if (isObj(firstScheme)) {
      const type = typeof firstScheme.type === 'string' ? (firstScheme.type as string) : undefined
      if (
        type === 'http' &&
        typeof firstScheme.scheme === 'string' &&
        firstScheme.scheme === 'bearer'
      ) {
        generator.addAuth({
          type: 'bearer',
          bearer: { token: '{{authToken}}' },
        })
      } else if (type === 'apikey') {
        const name =
          typeof firstScheme.name === 'string' ? (firstScheme.name as string) : 'X-API-Key'
        const loc =
          typeof firstScheme.in === 'string' ? (firstScheme.in as 'header' | 'query') : 'header'
        generator.addAuth({
          type: 'apikey',
          apikey: {
            key: name,
            value: '{{apiKey}}',
            in: loc,
          },
        })
      }
    }
  }

  // Process paths
  const paths = isObj(spec.paths) ? (spec.paths as Record<string, unknown>) : undefined
  if (paths) {
    const folders = new Set<string>()

    Object.entries(paths).forEach(([path, pathItemUnknown]) => {
      if (!isObj(pathItemUnknown)) return
      const pathItem = pathItemUnknown as Record<string, unknown>
      Object.entries(pathItem).forEach(([method, operationUnknown]) => {
        if (['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
          const op = isObj(operationUnknown) ? (operationUnknown as Record<string, unknown>) : {}
          const tags = Array.isArray(op.tags) ? (op.tags as string[]) : undefined
          const folder = tags?.[0] || 'Default'
          folders.add(folder)

          const tests = fullConfig.includeTests
            ? [
                'pm.test("Status code is successful", function () {',
                '    pm.expect(pm.response.code).to.be.oneOf([200, 201, 204]);',
                '});',
                '',
                'pm.test("Response time is less than 2000ms", function () {',
                '    pm.expect(pm.response.responseTime).to.be.below(2000);',
                '});',
                '',
                'pm.test("Response has valid JSON", function () {',
                '    pm.response.to.have.jsonBody();',
                '});',
              ]
            : undefined

          let examples:
            | Array<{
                name: string
                status: number
                body: unknown
                headers?: Record<string, string>
              }>
            | undefined
          const responses = isObj(op.responses)
            ? (op.responses as Record<string, unknown>)
            : undefined
          if (responses) {
            examples = Object.entries(responses)
              .filter(([status]) => status.startsWith('2'))
              .map(([status, responseUnknown]) => {
                let exampleBody: unknown = {}
                if (isObj(responseUnknown)) {
                  const content = isObj(responseUnknown.content)
                    ? (responseUnknown.content as Record<string, unknown>)
                    : undefined
                  const appJson =
                    content && isObj(content['application/json'])
                      ? (content['application/json'] as Record<string, unknown>)
                      : undefined
                  if (appJson && 'example' in appJson) {
                    exampleBody = (appJson.example as unknown) ?? {}
                  }
                }
                return {
                  name: `${status} Response`,
                  status: parseInt(status, 10),
                  body: exampleBody,
                  headers: { 'Content-Type': 'application/json' },
                }
              })
          }

          generator.addRequest(
            typeof op.summary === 'string'
              ? (op.summary as string)
              : `${method.toUpperCase()} ${path}`,
            method,
            path,
            {
              description:
                typeof op.description === 'string' ? (op.description as string) : undefined,
              folder,
              tests,
              examples,
            }
          )
        }
      })
    })

    // Create folders
    folders.forEach(folder => {
      generator.addFolder(folder)
    })
  }

  return generator
}

// Predefined Postman configurations
export const POSTMAN_CONFIGS = {
  basic: {
    ...DEFAULT_POSTMAN_CONFIG,
    name: 'Basic API Collection',
    includeTests: false,
    includeExamples: false,
    generateEnvironment: false,
  } as PostmanConfig,

  testing: {
    ...DEFAULT_POSTMAN_CONFIG,
    name: 'API Testing Collection',
    includeTests: true,
    includeExamples: true,
    generateEnvironment: true,
    events: [
      {
        listen: 'prerequest' as const,
        script: {
          type: 'text/javascript' as const,
          exec: [
            '// Set timestamp for requests',
            'pm.globals.set("timestamp", new Date().toISOString());',
            '',
            '// Log request details',
            'console.log("Making " + pm.request.method + " request to " + pm.request.url);',
          ],
        },
      },
      {
        listen: 'test' as const,
        script: {
          type: 'text/javascript' as const,
          exec: [
            '// Global test for all requests',
            'pm.test("Response time is acceptable", function () {',
            '    pm.expect(pm.response.responseTime).to.be.below(5000);',
            '});',
            '',
            '// Log response details',
            'console.log("Response: " + pm.response.status + " " + pm.response.code);',
          ],
        },
      },
    ],
  } as PostmanConfig,

  development: {
    ...DEFAULT_POSTMAN_CONFIG,
    name: 'Development API Collection',
    baseUrl: 'http://localhost:3000',
    includeTests: true,
    includeExamples: true,
    generateEnvironment: true,
    variables: [
      {
        key: 'baseUrl',
        value: 'http://localhost:3000',
        type: 'string',
        description: 'Development server URL',
      },
      {
        key: 'apiVersion',
        value: 'v1',
        type: 'string',
        description: 'API version',
      },
    ],
  } as PostmanConfig,

  production: {
    ...DEFAULT_POSTMAN_CONFIG,
    name: 'Production API Collection',
    baseUrl: '{{productionUrl}}',
    includeTests: true,
    includeExamples: false,
    generateEnvironment: true,
    variables: [
      {
        key: 'productionUrl',
        value: 'https://api.example.com',
        type: 'string',
        description: 'Production server URL',
      },
      {
        key: 'apiVersion',
        value: 'v1',
        type: 'string',
        description: 'API version',
      },
    ],
    auth: {
      type: 'bearer',
      bearer: { token: '{{authToken}}' },
    },
  } as PostmanConfig,
}

// Usage examples
export const POSTMAN_EXAMPLES = {
  basic: `
import { PostmanGenerator, POSTMAN_CONFIGS } from './postman.template'

const generator = new PostmanGenerator(POSTMAN_CONFIGS.basic)

generator
  .addRequest('Get Users', 'GET', '/users', {
    description: 'Retrieve all users',
    folder: 'Users',
  })
  .addRequest('Create User', 'POST', '/users', {
    description: 'Create a new user',
    folder: 'Users',
    body: {
      name: 'John Doe',
      email: 'john@example.com',
    },
  })

const collection = generator.exportCollection()
console.log(collection)
`,

  fromOpenAPI: `
import { createPostmanFromOpenAPI, POSTMAN_CONFIGS } from './postman.template'

const openApiSpec = {
  info: { title: 'My API', version: '1.0.0' },
  servers: [{ url: 'https://api.example.com' }],
  paths: {
    '/users': {
      get: {
        summary: 'Get Users',
        tags: ['Users'],
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                example: [{ id: 1, name: 'John' }]
              }
            }
          }
        }
      }
    }
  }
}

const generator = createPostmanFromOpenAPI(openApiSpec, POSTMAN_CONFIGS.testing)
const collection = generator.exportCollection()
const environment = generator.exportEnvironment()
`,

  withAuthentication: `
import { PostmanGenerator } from './postman.template'

const generator = new PostmanGenerator({
  name: 'Authenticated API',
  baseUrl: 'https://api.example.com',
  auth: {
    type: 'bearer',
    bearer: { token: '{{authToken}}' }
  },
  includeTests: true,
})

generator
  .addRequest('Login', 'POST', '/auth/login', {
    description: 'Authenticate user',
    body: {
      email: '{{userEmail}}',
      password: '{{userPassword}}'
    },
    tests: [
      'pm.test("Login successful", function () {',
      '    pm.response.to.have.status(200);',
      '    const response = pm.response.json();',
      '    pm.expect(response).to.have.property("token");',
      '    pm.globals.set("authToken", response.token);',
      '});'
    ]
  })
  .addRequest('Get Profile', 'GET', '/profile', {
    description: 'Get user profile',
    folder: 'User',
  })
`,

  comprehensive: `
import { 
  PostmanGenerator, 
  createPostmanFromOpenAPI,
  POSTMAN_CONFIGS 
} from './postman.template'

// Create from OpenAPI spec
const generator = createPostmanFromOpenAPI(openApiSpec, {
  ...POSTMAN_CONFIGS.testing,
  name: 'Comprehensive API Collection',
  auth: {
    type: 'bearer',
    bearer: { token: '{{authToken}}' }
  },
  variables: [
    {
      key: 'baseUrl',
      value: 'https://api.example.com',
      description: 'API base URL'
    },
    {
      key: 'userEmail',
      value: 'test@example.com',
      description: 'Test user email'
    }
  ],
  events: [
    {
      listen: 'prerequest',
      script: {
        type: 'text/javascript',
        exec: [
          '// Auto-refresh token if expired',
          'const token = pm.globals.get("authToken");',
          'if (!token || isTokenExpired(token)) {',
          '    // Refresh token logic here',
          '}'
        ]
      }
    }
  ]
})

// Export both collection and environment
const collection = generator.exportCollection()
const environment = generator.exportEnvironment()

// Save to files
require('fs').writeFileSync('collection.json', collection)
require('fs').writeFileSync('environment.json', environment)
`,
}
