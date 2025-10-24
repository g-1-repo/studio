import path from 'node:path'
import { ensureWritableDirectory } from '../utils/file-system.js'
import { createTemplateVariables, renderTemplateToFile } from '../utils/template.js'
import type { GenerateOptions } from '../types/index.js'

export async function generateMiddleware(options: GenerateOptions): Promise<string[]> {
  const {
    name,
    directory = '.',
    force = false,
    includeTests = true,
    includeDocs = true,
  } = options

  const generatedFiles: string[] = []
  const outputDir = path.resolve(directory)

  // Ensure output directory exists
  await ensureWritableDirectory(outputDir)

  // Create template variables
  const variables = createTemplateVariables({
    projectName: name,
    ...options,
  })

  // Middleware main file
  const middlewareFile = path.join(outputDir, `${variables.kebabName}.middleware.ts`)
  await renderTemplateToFile(
    getMiddlewareTemplate(),
    middlewareFile,
    variables,
    { overwrite: force },
  )
  generatedFiles.push(middlewareFile)

  // Middleware types file
  const typesFile = path.join(outputDir, `${variables.kebabName}.types.ts`)
  await renderTemplateToFile(
    getMiddlewareTypesTemplate(),
    typesFile,
    variables,
    { overwrite: force },
  )
  generatedFiles.push(typesFile)

  // Test file
  if (includeTests) {
    const testFile = path.join(outputDir, `${variables.kebabName}.middleware.test.ts`)
    await renderTemplateToFile(
      getMiddlewareTestTemplate(),
      testFile,
      variables,
      { overwrite: force },
    )
    generatedFiles.push(testFile)
  }

  // Documentation file
  if (includeDocs) {
    const docsFile = path.join(outputDir, `${variables.kebabName}-middleware.md`)
    await renderTemplateToFile(
      getMiddlewareDocsTemplate(),
      docsFile,
      variables,
      { overwrite: force },
    )
    generatedFiles.push(docsFile)
  }

  return generatedFiles
}

function getMiddlewareTemplate(): string {
  return `import type { Request, Response, NextFunction } from 'express'
import type { 
  {{pascalName}}Config, 
  {{pascalName}}Request, 
  {{pascalName}}Response,
  {{pascalName}}Context 
} from './{{kebabName}}.types.js'

/**
 * {{name}} Middleware
 * 
 * {{description}}
 */
export class {{pascalName}}Middleware {
  private config: {{pascalName}}Config
  private context: {{pascalName}}Context = {}

  constructor(config: Partial<{{pascalName}}Config> = {}) {
    this.config = {
      enabled: true,
      skipPaths: [],
      skipMethods: [],
      logRequests: true,
      logResponses: false,
      timeout: 30000,
      maxRequestSize: '10mb',
      customHeaders: {},
      ...config
    }
  }

  /**
   * Main middleware function
   */
  public middleware = (req: {{pascalName}}Request, res: {{pascalName}}Response, next: NextFunction): void => {
    // Skip if disabled
    if (!this.config.enabled) {
      return next()
    }

    // Skip specific paths
    if (this.shouldSkipPath(req.path)) {
      return next()
    }

    // Skip specific methods
    if (this.shouldSkipMethod(req.method)) {
      return next()
    }

    // Add middleware context to request
    req.{{camelName}} = {
      startTime: Date.now(),
      id: this.generateRequestId(),
      metadata: {}
    }

    // Add custom headers
    this.addCustomHeaders(res)

    // Log request if enabled
    if (this.config.logRequests) {
      this.logRequest(req)
    }

    // Set up response logging
    if (this.config.logResponses) {
      this.setupResponseLogging(req, res)
    }

    // Set timeout if configured
    if (this.config.timeout > 0) {
      this.setupTimeout(req, res, next)
    }

    // Process request
    this.processRequest(req, res, next)
  }

  /**
   * Process the request
   */
  private processRequest(req: {{pascalName}}Request, res: {{pascalName}}Response, next: NextFunction): void {
    try {
      // Add your custom processing logic here
      this.beforeProcess(req, res)

      // Continue to next middleware
      next()

      // Post-process (this runs after the response is sent)
      this.afterProcess(req, res)

    } catch (error) {
      this.handleError(error, req, res, next)
    }
  }

  /**
   * Before processing hook
   */
  private beforeProcess(req: {{pascalName}}Request, res: {{pascalName}}Response): void {
    // Validate request
    if (!this.validateRequest(req)) {
      throw new Error('Invalid request')
    }

    // Transform request if needed
    this.transformRequest(req)

    // Add metadata
    if (req.{{camelName}}) {
      req.{{camelName}}.metadata = {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * After processing hook
   */
  private afterProcess(req: {{pascalName}}Request, res: {{pascalName}}Response): void {
    if (req.{{camelName}}) {
      const duration = Date.now() - req.{{camelName}}.startTime
      
      // Log performance metrics
      if (this.config.logRequests) {
        console.log(\`{{name}} middleware: \${req.method} \${req.path} - \${duration}ms\`)
      }

      // Update context
      this.updateContext(req, res, duration)
    }
  }

  /**
   * Validate request
   */
  private validateRequest(req: {{pascalName}}Request): boolean {
    // Add your validation logic here
    
    // Check content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type')
      if (!contentType) {
        return false
      }
    }

    // Check request size
    const contentLength = req.get('Content-Length')
    if (contentLength && parseInt(contentLength) > this.parseSize(this.config.maxRequestSize)) {
      return false
    }

    return true
  }

  /**
   * Transform request
   */
  private transformRequest(req: {{pascalName}}Request): void {
    // Add your request transformation logic here
    
    // Example: normalize headers
    if (req.headers) {
      // Convert headers to lowercase
      const normalizedHeaders = {}
      for (const [key, value] of Object.entries(req.headers)) {
        normalizedHeaders[key.toLowerCase()] = value
      }
      req.headers = normalizedHeaders
    }
  }

  /**
   * Add custom headers to response
   */
  private addCustomHeaders(res: {{pascalName}}Response): void {
    for (const [key, value] of Object.entries(this.config.customHeaders)) {
      res.setHeader(key, value)
    }

    // Add middleware identifier
    res.setHeader('X-{{pascalName}}-Middleware', '1.0.0')
  }

  /**
   * Set up request timeout
   */
  private setupTimeout(req: {{pascalName}}Request, res: {{pascalName}}Response, next: NextFunction): void {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: 'Request Timeout',
          message: \`Request timed out after \${this.config.timeout}ms\`
        })
      }
    }, this.config.timeout)

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timeout)
    })

    res.on('close', () => {
      clearTimeout(timeout)
    })
  }

  /**
   * Set up response logging
   */
  private setupResponseLogging(req: {{pascalName}}Request, res: {{pascalName}}Response): void {
    const originalSend = res.send
    const originalJson = res.json

    res.send = function(body) {
      console.log(\`{{name}} Response: \${req.method} \${req.path} - \${res.statusCode}\`)
      return originalSend.call(this, body)
    }

    res.json = function(body) {
      console.log(\`{{name}} JSON Response: \${req.method} \${req.path} - \${res.statusCode}\`)
      return originalJson.call(this, body)
    }
  }

  /**
   * Log request
   */
  private logRequest(req: {{pascalName}}Request): void {
    console.log(\`{{name}} Request: \${req.method} \${req.path} - \${req.ip}\`)
  }

  /**
   * Handle errors
   */
  private handleError(error: any, req: {{pascalName}}Request, res: {{pascalName}}Response, next: NextFunction): void {
    console.error(\`{{name}} Middleware Error:\`, error)

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred in {{name}} middleware'
      })
    } else {
      next(error)
    }
  }

  /**
   * Update context with request information
   */
  private updateContext(req: {{pascalName}}Request, res: {{pascalName}}Response, duration: number): void {
    const key = \`\${req.method}:\${req.path}\`
    
    if (!this.context[key]) {
      this.context[key] = {
        count: 0,
        totalDuration: 0,
        avgDuration: 0
      }
    }

    this.context[key].count++
    this.context[key].totalDuration += duration
    this.context[key].avgDuration = this.context[key].totalDuration / this.context[key].count
  }

  /**
   * Check if path should be skipped
   */
  private shouldSkipPath(path: string): boolean {
    return this.config.skipPaths.some(skipPath => {
      if (typeof skipPath === 'string') {
        return path === skipPath
      }
      if (skipPath instanceof RegExp) {
        return skipPath.test(path)
      }
      return false
    })
  }

  /**
   * Check if method should be skipped
   */
  private shouldSkipMethod(method: string): boolean {
    return this.config.skipMethods.includes(method.toUpperCase())
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`
  }

  /**
   * Parse size string to bytes
   */
  private parseSize(size: string): number {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 }
    const match = size.toLowerCase().match(/^(\\d+(?:\\.\\d+)?)\\s*(b|kb|mb|gb)?$/)
    
    if (!match) {
      return 0
    }

    const value = parseFloat(match[1])
    const unit = match[2] || 'b'
    
    return Math.floor(value * units[unit])
  }

  /**
   * Get middleware statistics
   */
  public getStats(): {{pascalName}}Context {
    return { ...this.context }
  }

  /**
   * Reset middleware statistics
   */
  public resetStats(): void {
    this.context = {}
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<{{pascalName}}Config>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  public getConfig(): {{pascalName}}Config {
    return { ...this.config }
  }
}

/**
 * Factory function to create middleware
 */
export function create{{pascalName}}Middleware(config?: Partial<{{pascalName}}Config>): {{pascalName}}Middleware {
  return new {{pascalName}}Middleware(config)
}

/**
 * Express middleware function
 */
export function {{camelName}}Middleware(config?: Partial<{{pascalName}}Config>) {
  const middleware = new {{pascalName}}Middleware(config)
  return middleware.middleware
}

export default {{pascalName}}Middleware`
}

function getMiddlewareTypesTemplate(): string {
  return `import type { Request, Response } from 'express'

// Configuration interface
export interface {{pascalName}}Config {
  enabled: boolean
  skipPaths: (string | RegExp)[]
  skipMethods: string[]
  logRequests: boolean
  logResponses: boolean
  timeout: number
  maxRequestSize: string
  customHeaders: Record<string, string>
}

// Request extension
export interface {{pascalName}}Request extends Request {
  {{camelName}}?: {
    startTime: number
    id: string
    metadata: Record<string, any>
  }
}

// Response extension
export interface {{pascalName}}Response extends Response {
  // Add any response extensions here
}

// Context for storing middleware statistics
export interface {{pascalName}}Context {
  [key: string]: {
    count: number
    totalDuration: number
    avgDuration: number
  }
}

// Middleware options
export interface {{pascalName}}Options {
  config?: Partial<{{pascalName}}Config>
}

// Error types
export interface {{pascalName}}Error extends Error {
  code?: string
  statusCode?: number
  details?: any
}

// Statistics interface
export interface {{pascalName}}Stats {
  totalRequests: number
  averageResponseTime: number
  errorCount: number
  routes: Record<string, {
    count: number
    avgDuration: number
    lastAccessed: string
  }>
}

// Event types
export interface {{pascalName}}Events {
  'request:start': { req: {{pascalName}}Request; timestamp: string }
  'request:end': { req: {{pascalName}}Request; res: {{pascalName}}Response; duration: number }
  'request:error': { req: {{pascalName}}Request; error: {{pascalName}}Error }
  'request:timeout': { req: {{pascalName}}Request; timeout: number }
}

// Validation result
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// Transform options
export interface TransformOptions {
  normalizeHeaders?: boolean
  trimStrings?: boolean
  parseNumbers?: boolean
  validateTypes?: boolean
}

// Logging options
export interface LoggingOptions {
  level: 'debug' | 'info' | 'warn' | 'error'
  format: 'json' | 'text'
  includeHeaders?: boolean
  includeBody?: boolean
  maxBodyLength?: number
}

// Performance metrics
export interface PerformanceMetrics {
  requestCount: number
  averageResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  errorRate: number
  throughput: number
}

// Health check result
export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded'
  checks: Record<string, {
    status: 'pass' | 'fail' | 'warn'
    message?: string
    duration?: number
  }>
  timestamp: string
}

export type {{pascalName}}LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type {{pascalName}}Status = 'active' | 'inactive' | 'error'`
}

function getMiddlewareTestTemplate(): string {
  return `import { Request, Response, NextFunction } from 'express'
import { {{pascalName}}Middleware, {{camelName}}Middleware } from './{{kebabName}}.middleware.js'
import type { {{pascalName}}Config, {{pascalName}}Request, {{pascalName}}Response } from './{{kebabName}}.types.js'

// Mock Express objects
const createMockRequest = (overrides: Partial<Request> = {}): {{pascalName}}Request => ({
  method: 'GET',
  path: '/test',
  ip: '127.0.0.1',
  headers: {},
  get: jest.fn((header: string) => {
    const headers = { 'user-agent': 'test-agent', 'content-type': 'application/json' }
    return headers[header.toLowerCase()]
  }),
  ...overrides
} as {{pascalName}}Request)

const createMockResponse = (overrides: Partial<Response> = {}): {{pascalName}}Response => ({
  setHeader: jest.fn(),
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
  headersSent: false,
  on: jest.fn(),
  ...overrides
} as {{pascalName}}Response)

const createMockNext = (): NextFunction => jest.fn()

describe('{{pascalName}}Middleware', () => {
  let middleware: {{pascalName}}Middleware
  let mockReq: {{pascalName}}Request
  let mockRes: {{pascalName}}Response
  let mockNext: NextFunction

  beforeEach(() => {
    middleware = new {{pascalName}}Middleware()
    mockReq = createMockRequest()
    mockRes = createMockResponse()
    mockNext = createMockNext()
    
    // Clear console mocks
    jest.clearAllMocks()
    console.log = jest.fn()
    console.error = jest.fn()
  })

  describe('Constructor', () => {
    test('should initialize with default config', () => {
      const config = middleware.getConfig()
      
      expect(config.enabled).toBe(true)
      expect(config.logRequests).toBe(true)
      expect(config.logResponses).toBe(false)
      expect(config.timeout).toBe(30000)
      expect(config.skipPaths).toEqual([])
      expect(config.skipMethods).toEqual([])
    })

    test('should accept custom config', () => {
      const customConfig: Partial<{{pascalName}}Config> = {
        enabled: false,
        logRequests: false,
        timeout: 5000,
        skipPaths: ['/health']
      }
      
      const customMiddleware = new {{pascalName}}Middleware(customConfig)
      const config = customMiddleware.getConfig()
      
      expect(config.enabled).toBe(false)
      expect(config.logRequests).toBe(false)
      expect(config.timeout).toBe(5000)
      expect(config.skipPaths).toEqual(['/health'])
    })
  })

  describe('Middleware Function', () => {
    test('should call next() when enabled', () => {
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockReq.{{camelName}}).toBeDefined()
      expect(mockReq.{{camelName}}?.startTime).toBeGreaterThan(0)
      expect(mockReq.{{camelName}}?.id).toBeDefined()
    })

    test('should skip when disabled', () => {
      middleware.updateConfig({ enabled: false })
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockReq.{{camelName}}).toBeUndefined()
    })

    test('should skip specified paths', () => {
      middleware.updateConfig({ skipPaths: ['/health', /^\\/api\\/internal/] })
      
      // Test string path
      mockReq.path = '/health'
      middleware.middleware(mockReq, mockRes, mockNext)
      expect(mockReq.{{camelName}}).toBeUndefined()
      
      // Test regex path
      mockReq.path = '/api/internal/status'
      middleware.middleware(mockReq, mockRes, mockNext)
      expect(mockReq.{{camelName}}).toBeUndefined()
    })

    test('should skip specified methods', () => {
      middleware.updateConfig({ skipMethods: ['OPTIONS', 'HEAD'] })
      
      mockReq.method = 'OPTIONS'
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(mockNext).toHaveBeenCalled()
      expect(mockReq.{{camelName}}).toBeUndefined()
    })

    test('should add custom headers', () => {
      const customHeaders = { 'X-Custom-Header': 'test-value' }
      middleware.updateConfig({ customHeaders })
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Custom-Header', 'test-value')
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-{{pascalName}}-Middleware', '1.0.0')
    })

    test('should log requests when enabled', () => {
      middleware.updateConfig({ logRequests: true })
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('{{name}} Request: GET /test - 127.0.0.1')
      )
    })

    test('should not log requests when disabled', () => {
      middleware.updateConfig({ logRequests: false })
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(console.log).not.toHaveBeenCalled()
    })
  })

  describe('Request Validation', () => {
    test('should validate POST requests with content type', () => {
      mockReq.method = 'POST'
      mockReq.get = jest.fn((header) => {
        if (header === 'Content-Type') return 'application/json'
        return undefined
      })
      
      expect(() => {
        middleware.middleware(mockReq, mockRes, mockNext)
      }).not.toThrow()
    })

    test('should reject POST requests without content type', () => {
      mockReq.method = 'POST'
      mockReq.get = jest.fn(() => undefined)
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('{{name}} Middleware Error:'),
        expect.any(Error)
      )
    })

    test('should validate request size', () => {
      middleware.updateConfig({ maxRequestSize: '1kb' })
      mockReq.get = jest.fn((header) => {
        if (header === 'Content-Length') return '2048' // 2KB
        return undefined
      })
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('Request Transformation', () => {
    test('should normalize headers', () => {
      mockReq.headers = {
        'Content-Type': 'application/json',
        'USER-AGENT': 'test-agent'
      }
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(mockReq.headers).toEqual({
        'content-type': 'application/json',
        'user-agent': 'test-agent'
      })
    })
  })

  describe('Timeout Handling', () => {
    test('should set up timeout', (done) => {
      middleware.updateConfig({ timeout: 100 })
      
      // Mock setTimeout
      const originalSetTimeout = globalThis.setTimeout
    globalThis.setTimeout = jest.fn((callback, delay) => {
        expect(delay).toBe(100)
        // Don't actually call the timeout callback in tests
        return 123 as any
      })
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(globalThis.setTimeout).toHaveBeenCalled()

      // Restore original setTimeout
      globalThis.setTimeout = originalSetTimeout
      done()
    })
  })

  describe('Statistics', () => {
    test('should track request statistics', () => {
      middleware.middleware(mockReq, mockRes, mockNext)
      
      // Simulate request completion
      const stats = middleware.getStats()
      expect(stats).toBeDefined()
    })

    test('should reset statistics', () => {
      middleware.middleware(mockReq, mockRes, mockNext)
      
      middleware.resetStats()
      const stats = middleware.getStats()
      
      expect(Object.keys(stats)).toHaveLength(0)
    })
  })

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const updates = { logRequests: false, timeout: 5000 }
      middleware.updateConfig(updates)
      
      const config = middleware.getConfig()
      expect(config.logRequests).toBe(false)
      expect(config.timeout).toBe(5000)
    })

    test('should preserve existing config when updating', () => {
      const originalConfig = middleware.getConfig()
      middleware.updateConfig({ timeout: 5000 })
      
      const updatedConfig = middleware.getConfig()
      expect(updatedConfig.enabled).toBe(originalConfig.enabled)
      expect(updatedConfig.timeout).toBe(5000)
    })
  })

  describe('Factory Functions', () => {
    test('should create middleware with factory function', () => {
      const config = { logRequests: false }
      const createdMiddleware = create{{pascalName}}Middleware(config)
      
      expect(createdMiddleware).toBeInstanceOf({{pascalName}}Middleware)
      expect(createdMiddleware.getConfig().logRequests).toBe(false)
    })

    test('should create express middleware function', () => {
      const expressMiddleware = {{camelName}}Middleware({ enabled: true })
      
      expect(typeof expressMiddleware).toBe('function')
      expect(expressMiddleware.length).toBe(3) // req, res, next
    })
  })

  describe('Error Handling', () => {
    test('should handle errors gracefully', () => {
      // Force an error by making validation throw
      const originalValidate = middleware['validateRequest']
      middleware['validateRequest'] = jest.fn(() => {
        throw new Error('Test error')
      })
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('{{name}} Middleware Error:'),
        expect.any(Error)
      )
      
      // Restore original method
      middleware['validateRequest'] = originalValidate
    })

    test('should send error response when headers not sent', () => {
      mockRes.headersSent = false
      
      // Force an error
      const originalValidate = middleware['validateRequest']
      middleware['validateRequest'] = jest.fn(() => {
        throw new Error('Test error')
      })
      
      middleware.middleware(mockReq, mockRes, mockNext)
      
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An error occurred in {{name}} middleware'
      })
      
      // Restore original method
      middleware['validateRequest'] = originalValidate
    })
  })
})`
}

function getMiddlewareDocsTemplate(): string {
  return `# {{name}} Middleware

Express middleware for {{description}}.

## Installation

\`\`\`bash
npm install {{kebabName}}-middleware
\`\`\`

## Usage

### Basic Usage

\`\`\`typescript
import express from 'express'
import { {{camelName}}Middleware } from '{{kebabName}}-middleware'

const app = express()

// Use middleware with default configuration
app.use({{camelName}}Middleware())

// Or with custom configuration
app.use({{camelName}}Middleware({
  logRequests: true,
  timeout: 5000,
  skipPaths: ['/health', '/metrics']
}))
\`\`\`

### Advanced Usage

\`\`\`typescript
import { {{pascalName}}Middleware } from '{{kebabName}}-middleware'

// Create middleware instance for more control
const middleware = new {{pascalName}}Middleware({
  enabled: true,
  logRequests: true,
  logResponses: false,
  timeout: 30000,
  maxRequestSize: '10mb',
  skipPaths: ['/health', /^\\/api\\/internal/],
  skipMethods: ['OPTIONS', 'HEAD'],
  customHeaders: {
    'X-API-Version': '1.0.0',
    'X-Service': 'my-service'
  }
})

app.use(middleware.middleware)

// Get statistics
app.get('/stats', (req, res) => {
  res.json(middleware.getStats())
})

// Update configuration at runtime
app.post('/config', (req, res) => {
  middleware.updateConfig(req.body)
  res.json({ message: 'Configuration updated' })
})
\`\`\`

## Configuration

The middleware accepts the following configuration options:

\`\`\`typescript
interface {{pascalName}}Config {
  enabled: boolean                    // Enable/disable middleware (default: true)
  skipPaths: (string | RegExp)[]      // Paths to skip (default: [])
  skipMethods: string[]               // HTTP methods to skip (default: [])
  logRequests: boolean                // Log incoming requests (default: true)
  logResponses: boolean               // Log outgoing responses (default: false)
  timeout: number                     // Request timeout in ms (default: 30000)
  maxRequestSize: string              // Maximum request size (default: '10mb')
  customHeaders: Record<string, string> // Custom headers to add (default: {})
}
\`\`\`

### Configuration Examples

#### Basic Configuration

\`\`\`typescript
app.use({{camelName}}Middleware({
  logRequests: true,
  timeout: 5000
}))
\`\`\`

#### Skip Specific Paths

\`\`\`typescript
app.use({{camelName}}Middleware({
  skipPaths: [
    '/health',           // Exact path match
    '/metrics',          // Exact path match
    /^\\/api\\/internal/, // Regex pattern
    /\\.json$/           // Files ending with .json
  ]
}))
\`\`\`

#### Skip HTTP Methods

\`\`\`typescript
app.use({{camelName}}Middleware({
  skipMethods: ['OPTIONS', 'HEAD']
}))
\`\`\`

#### Custom Headers

\`\`\`typescript
app.use({{camelName}}Middleware({
  customHeaders: {
    'X-API-Version': '1.0.0',
    'X-Service-Name': 'my-api',
    'X-Request-ID': 'auto-generated'
  }
}))
\`\`\`

#### Request Size Limits

\`\`\`typescript
app.use({{camelName}}Middleware({
  maxRequestSize: '5mb'  // Supports: b, kb, mb, gb
}))
\`\`\`

## Features

### Request Processing

- **Request Validation**: Validates incoming requests based on content type and size
- **Request Transformation**: Normalizes headers and request data
- **Request ID Generation**: Adds unique ID to each request
- **Metadata Collection**: Collects request metadata (IP, User-Agent, etc.)

### Response Processing

- **Custom Headers**: Adds configurable custom headers to responses
- **Response Logging**: Optional logging of response data
- **Performance Tracking**: Tracks response times and request counts

### Error Handling

- **Graceful Error Handling**: Catches and handles middleware errors
- **Timeout Protection**: Prevents requests from hanging indefinitely
- **Validation Errors**: Proper error responses for invalid requests

### Statistics and Monitoring

- **Request Statistics**: Tracks request counts and response times per route
- **Performance Metrics**: Average response times and throughput
- **Runtime Configuration**: Update configuration without restarting

## API Reference

### {{pascalName}}Middleware Class

#### Constructor

\`\`\`typescript
new {{pascalName}}Middleware(config?: Partial<{{pascalName}}Config>)
\`\`\`

#### Methods

##### middleware(req, res, next)

Main middleware function to be used with Express.

##### getStats(): {{pascalName}}Context

Returns current middleware statistics.

\`\`\`typescript
const stats = middleware.getStats()
console.log(stats)
// Output:
// {
//   "GET:/api/users": {
//     "count": 150,
//     "totalDuration": 45000,
//     "avgDuration": 300
//   }
// }
\`\`\`

##### resetStats(): void

Resets all collected statistics.

##### updateConfig(updates: Partial<{{pascalName}}Config>): void

Updates middleware configuration at runtime.

##### getConfig(): {{pascalName}}Config

Returns current middleware configuration.

### Factory Functions

#### {{camelName}}Middleware(config?)

Creates and returns the middleware function directly.

\`\`\`typescript
import { {{camelName}}Middleware } from '{{kebabName}}-middleware'

app.use({{camelName}}Middleware({
  logRequests: true
}))
\`\`\`

#### create{{pascalName}}Middleware(config?)

Creates and returns a {{pascalName}}Middleware instance.

\`\`\`typescript
import { create{{pascalName}}Middleware } from '{{kebabName}}-middleware'

const middleware = create{{pascalName}}Middleware({
  enabled: true
})

app.use(middleware.middleware)
\`\`\`

## Request Extensions

The middleware extends the Express Request object with additional properties:

\`\`\`typescript
interface {{pascalName}}Request extends Request {
  {{camelName}}?: {
    startTime: number        // Request start timestamp
    id: string              // Unique request ID
    metadata: {             // Request metadata
      userAgent?: string
      ip: string
      timestamp: string
    }
  }
}
\`\`\`

### Accessing Request Data

\`\`\`typescript
app.get('/api/data', (req, res) => {
  if (req.{{camelName}}) {
    console.log('Request ID:', req.{{camelName}}.id)
    console.log('Start Time:', req.{{camelName}}.startTime)
    console.log('Metadata:', req.{{camelName}}.metadata)
  }
  
  res.json({ message: 'Success' })
})
\`\`\`

## Examples

### Complete Express Application

\`\`\`typescript
import express from 'express'
import { {{pascalName}}Middleware } from '{{kebabName}}-middleware'

const app = express()

// Create middleware instance
const middleware = new {{pascalName}}Middleware({
  logRequests: true,
  logResponses: true,
  timeout: 10000,
  skipPaths: ['/health', '/metrics'],
  customHeaders: {
    'X-API-Version': '1.0.0'
  }
})

// Use middleware
app.use(middleware.middleware)

// API routes
app.get('/api/users', (req, res) => {
  res.json({ users: [] })
})

app.post('/api/users', (req, res) => {
  res.json({ message: 'User created' })
})

// Statistics endpoint
app.get('/stats', (req, res) => {
  res.json(middleware.getStats())
})

// Health check (skipped by middleware)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
\`\`\`

### With Error Handling

\`\`\`typescript
import express from 'express'
import { {{camelName}}Middleware } from '{{kebabName}}-middleware'

const app = express()

// Middleware with error handling
app.use({{camelName}}Middleware({
  logRequests: true,
  timeout: 5000
}))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Application error:', err)
  res.status(500).json({
    error: 'Internal Server Error',
    requestId: req.{{camelName}}?.id
  })
})

app.listen(3000)
\`\`\`

## License

MIT`
}

export default generateMiddleware
