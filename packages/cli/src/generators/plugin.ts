import path from 'node:path'
import { ensureWritableDirectory, writeJsonFile } from '../utils/file-system.js'
import { createTemplateVariables, renderTemplateToFile } from '../utils/template.js'
import type { GenerateOptions } from '../types/index.js'

export async function generatePlugin(options: GenerateOptions): Promise<string[]> {
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

  // Plugin main file
  const pluginFile = path.join(outputDir, `${variables.kebabName}.plugin.ts`)
  await renderTemplateToFile(
    getPluginTemplate(),
    pluginFile,
    variables,
    { overwrite: force },
  )
  generatedFiles.push(pluginFile)

  // Plugin types file
  const typesFile = path.join(outputDir, `${variables.kebabName}.types.ts`)
  await renderTemplateToFile(
    getPluginTypesTemplate(),
    typesFile,
    variables,
    { overwrite: force },
  )
  generatedFiles.push(typesFile)

  // Plugin configuration file
  const configFile = path.join(outputDir, `${variables.kebabName}.config.ts`)
  await renderTemplateToFile(
    getPluginConfigTemplate(),
    configFile,
    variables,
    { overwrite: force },
  )
  generatedFiles.push(configFile)

  // Test file
  if (includeTests) {
    const testFile = path.join(outputDir, `${variables.kebabName}.plugin.test.ts`)
    await renderTemplateToFile(
      getPluginTestTemplate(),
      testFile,
      variables,
      { overwrite: force },
    )
    generatedFiles.push(testFile)
  }

  // Documentation file
  if (includeDocs) {
    const docsFile = path.join(outputDir, `${variables.kebabName}.md`)
    await renderTemplateToFile(
      getPluginDocsTemplate(),
      docsFile,
      variables,
      { overwrite: force },
    )
    generatedFiles.push(docsFile)
  }

  // Package.json for standalone plugin
  const packageJsonFile = path.join(outputDir, 'package.json')
  const packageJsonData = {
    name: `@g-1/plugin-${variables.kebabName}`,
    version: '1.0.0',
    description: `G1 Framework plugin for ${variables.name}`,
    type: 'module',
    main: `${variables.kebabName}.plugin.js`,
    types: `${variables.kebabName}.plugin.d.ts`,
    files: [
      '*.js',
      '*.d.ts',
      '*.json',
      'README.md',
    ],
    scripts: {
      'build': 'tsc',
      'test': 'jest',
      'test:watch': 'jest --watch',
      'lint': 'eslint src --ext .ts',
      'lint:fix': 'eslint src --ext .ts --fix',
    },
    keywords: [
      'g1',
      'g1-framework',
      'plugin',
      variables.kebabName,
    ],
    author: '',
    license: 'MIT',
    peerDependencies: {
      '@g-1/core': '^1.0.0',
    },
    devDependencies: {
      '@types/jest': '^29.0.0',
      '@types/node': '^20.0.0',
      '@typescript-eslint/eslint-plugin': '^6.0.0',
      '@typescript-eslint/parser': '^6.0.0',
      'eslint': '^8.0.0',
      'jest': '^29.0.0',
      'ts-jest': '^29.0.0',
      'typescript': '^5.0.0',
    },
  }

  await writeJsonFile(packageJsonFile, packageJsonData, { spaces: 2 })
  generatedFiles.push(packageJsonFile)

  return generatedFiles
}

function getPluginTemplate(): string {
  return `import { BasePlugin } from '@g-1/core'
import type { {{pascalName}}Config, {{pascalName}}Context } from './{{kebabName}}.types.js'
import { default{{pascalName}}Config } from './{{kebabName}}.config.js'

export class {{pascalName}}Plugin extends BasePlugin<{{pascalName}}Config> {
  name = '{{kebabName}}'
  version = '1.0.0'

  private context: {{pascalName}}Context = {}

  constructor(config: Partial<{{pascalName}}Config> = {}) {
    super()
    this.config = this.mergeConfig(default{{pascalName}}Config, config)
  }

  async onRegister(): Promise<void> {
    this.logger.info(\`Registering {{name}} plugin\`)
    
    // Initialize plugin resources
    await this.initialize()
  }

  async onMount(): Promise<void> {
    this.logger.info(\`Mounting {{name}} plugin\`)
    
    // Set up plugin routes and middleware
    this.setupRoutes()
    this.setupMiddleware()
  }

  async onStart(): Promise<void> {
    this.logger.info(\`Starting {{name}} plugin\`)
    
    // Start plugin services
    await this.startServices()
  }

  async onStop(): Promise<void> {
    this.logger.info(\`Stopping {{name}} plugin\`)
    
    // Clean up plugin resources
    await this.cleanup()
  }

  async onUnmount(): Promise<void> {
    this.logger.info(\`Unmounting {{name}} plugin\`)
    
    // Remove plugin routes and middleware
    this.removeRoutes()
    this.removeMiddleware()
  }

  private async initialize(): Promise<void> {
    // Initialize plugin-specific resources
    // Example: database connections, external services, etc.
    
    if (this.config.enableFeatureA) {
      this.logger.debug('Feature A enabled')
      // Initialize Feature A
    }

    if (this.config.enableFeatureB) {
      this.logger.debug('Feature B enabled')
      // Initialize Feature B
    }
  }

  private setupRoutes(): void {
    // Define plugin routes
    this.router.get('/{{kebabName}}', this.handleGetStatus.bind(this))
    this.router.post('/{{kebabName}}/action', this.handleAction.bind(this))
    
    if (this.config.enableApi) {
      this.router.get('/{{kebabName}}/api', this.handleApiEndpoint.bind(this))
    }
  }

  private setupMiddleware(): void {
    // Add plugin-specific middleware
    if (this.config.enableMiddleware) {
      this.app.use('/{{kebabName}}', this.{{camelName}}Middleware.bind(this))
    }
  }

  private async startServices(): Promise<void> {
    // Start background services, schedulers, etc.
    if (this.config.enableScheduler) {
      // Start scheduler
      this.logger.debug('Scheduler started')
    }
  }

  private async cleanup(): Promise<void> {
    // Clean up resources
    this.context = {}
    
    if (this.config.enableScheduler) {
      // Stop scheduler
      this.logger.debug('Scheduler stopped')
    }
  }

  private removeRoutes(): void {
    // Remove plugin routes if needed
    // This is typically handled automatically by the framework
  }

  private removeMiddleware(): void {
    // Remove plugin middleware if needed
    // This is typically handled automatically by the framework
  }

  // Route handlers
  private async handleGetStatus(req: any, res: any): Promise<void> {
    res.json({
      plugin: this.name,
      version: this.version,
      status: 'active',
      config: this.getPublicConfig()
    })
  }

  private async handleAction(req: any, res: any): Promise<void> {
    try {
      const { action, data } = req.body

      switch (action) {
        case 'ping':
          res.json({ message: 'pong', timestamp: new Date().toISOString() })
          break
        
        case 'process':
          const result = await this.processData(data)
          res.json({ result })
          break
        
        default:
          res.status(400).json({ error: 'Unknown action' })
      }
    } catch (error) {
      this.logger.error('Action handler error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }

  private async handleApiEndpoint(req: any, res: any): Promise<void> {
    // API endpoint implementation
    res.json({
      message: '{{name}} API endpoint',
      data: this.context
    })
  }

  // Middleware
  private {{camelName}}Middleware(req: any, res: any, next: any): void {
    // Add plugin-specific request processing
    req.{{camelName}} = {
      plugin: this.name,
      timestamp: new Date().toISOString()
    }
    
    this.logger.debug(\`{{name}} middleware processed request: \${req.method} \${req.path}\`)
    next()
  }

  // Helper methods
  private async processData(data: any): Promise<any> {
    // Implement your data processing logic here
    return {
      processed: true,
      data,
      timestamp: new Date().toISOString()
    }
  }

  private getPublicConfig(): Partial<{{pascalName}}Config> {
    // Return only public configuration values
    return {
      enableFeatureA: this.config.enableFeatureA,
      enableFeatureB: this.config.enableFeatureB,
      enableApi: this.config.enableApi
    }
  }

  // Public API methods
  public getContext(): {{pascalName}}Context {
    return { ...this.context }
  }

  public updateContext(updates: Partial<{{pascalName}}Context>): void {
    this.context = { ...this.context, ...updates }
  }
}

// Export plugin factory
export function create{{pascalName}}Plugin(config?: Partial<{{pascalName}}Config>): {{pascalName}}Plugin {
  return new {{pascalName}}Plugin(config)
}

export default {{pascalName}}Plugin`
}

function getPluginTypesTemplate(): string {
  return `// {{name}} Plugin Types

export interface {{pascalName}}Config {
  // Feature toggles
  enableFeatureA: boolean
  enableFeatureB: boolean
  enableApi: boolean
  enableMiddleware: boolean
  enableScheduler: boolean

  // Configuration options
  apiPrefix: string
  maxRetries: number
  timeout: number

  // Custom settings
  customSettings: Record<string, any>
}

export interface {{pascalName}}Context {
  // Plugin runtime context
  [key: string]: any
}

export interface {{pascalName}}ActionRequest {
  action: string
  data?: any
}

export interface {{pascalName}}ActionResponse {
  success: boolean
  result?: any
  error?: string
}

export interface {{pascalName}}Status {
  plugin: string
  version: string
  status: 'active' | 'inactive' | 'error'
  uptime: number
  config: Partial<{{pascalName}}Config>
}

// Event types
export interface {{pascalName}}Events {
  'plugin:started': { timestamp: string }
  'plugin:stopped': { timestamp: string }
  'action:executed': { action: string; result: any }
  'error:occurred': { error: Error; context: any }
}

// Middleware types
export interface {{pascalName}}Request extends Request {
  {{camelName}}?: {
    plugin: string
    timestamp: string
    [key: string]: any
  }
}

// Plugin metadata
export interface {{pascalName}}Metadata {
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  repository?: string
  keywords: string[]
}

// Plugin hooks
export interface {{pascalName}}Hooks {
  beforeAction?: (action: string, data: any) => Promise<void>
  afterAction?: (action: string, result: any) => Promise<void>
  onError?: (error: Error, context: any) => Promise<void>
}

export type {{pascalName}}LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface {{pascalName}}Logger {
  debug(message: string, ...args: any[]): void
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}`
}

function getPluginConfigTemplate(): string {
  return `import type { {{pascalName}}Config } from './{{kebabName}}.types.js'

export const default{{pascalName}}Config: {{pascalName}}Config = {
  // Feature toggles
  enableFeatureA: true,
  enableFeatureB: false,
  enableApi: true,
  enableMiddleware: true,
  enableScheduler: false,

  // Configuration options
  apiPrefix: '/{{kebabName}}',
  maxRetries: 3,
  timeout: 5000,

  // Custom settings
  customSettings: {}
}

export default default{{pascalName}}Config`
}

function getPluginTestTemplate(): string {
  return `import { {{pascalName}}Plugin } from './{{kebabName}}.plugin.js'
import type { {{pascalName}}Config } from './{{kebabName}}.types.js'

describe('{{pascalName}}Plugin', () => {
  let plugin: {{pascalName}}Plugin

  beforeEach(() => {
    plugin = new {{pascalName}}Plugin()
  })

  afterEach(async () => {
    if (plugin) {
      await plugin.onStop()
    }
  })

  describe('Plugin Lifecycle', () => {
    test('should initialize with default config', () => {
      expect(plugin.name).toBe('{{kebabName}}')
      expect(plugin.version).toBe('1.0.0')
      expect(plugin.config).toBeDefined()
    })

    test('should accept custom config', () => {
      const customConfig: Partial<{{pascalName}}Config> = {
        enableFeatureA: false,
        maxRetries: 5
      }
      
      const customPlugin = new {{pascalName}}Plugin(customConfig)
      expect(customPlugin.config.enableFeatureA).toBe(false)
      expect(customPlugin.config.maxRetries).toBe(5)
    })

    test('should register successfully', async () => {
      await expect(plugin.onRegister()).resolves.not.toThrow()
    })

    test('should mount successfully', async () => {
      await plugin.onRegister()
      await expect(plugin.onMount()).resolves.not.toThrow()
    })

    test('should start successfully', async () => {
      await plugin.onRegister()
      await plugin.onMount()
      await expect(plugin.onStart()).resolves.not.toThrow()
    })

    test('should stop successfully', async () => {
      await plugin.onRegister()
      await plugin.onMount()
      await plugin.onStart()
      await expect(plugin.onStop()).resolves.not.toThrow()
    })

    test('should unmount successfully', async () => {
      await plugin.onRegister()
      await plugin.onMount()
      await expect(plugin.onUnmount()).resolves.not.toThrow()
    })
  })

  describe('Context Management', () => {
    test('should initialize with empty context', () => {
      const context = plugin.getContext()
      expect(context).toEqual({})
    })

    test('should update context', () => {
      const updates = { key: 'value', number: 42 }
      plugin.updateContext(updates)
      
      const context = plugin.getContext()
      expect(context).toEqual(updates)
    })

    test('should merge context updates', () => {
      plugin.updateContext({ key1: 'value1' })
      plugin.updateContext({ key2: 'value2' })
      
      const context = plugin.getContext()
      expect(context).toEqual({ key1: 'value1', key2: 'value2' })
    })
  })

  describe('Configuration', () => {
    test('should return public config', () => {
      const publicConfig = plugin['getPublicConfig']()
      
      expect(publicConfig).toHaveProperty('enableFeatureA')
      expect(publicConfig).toHaveProperty('enableFeatureB')
      expect(publicConfig).toHaveProperty('enableApi')
      expect(publicConfig).not.toHaveProperty('customSettings')
    })

    test('should validate config on creation', () => {
      const invalidConfig = { maxRetries: -1 }
      
      // This test assumes validation is implemented
      // Adjust based on your actual validation logic
      expect(() => new {{pascalName}}Plugin(invalidConfig)).not.toThrow()
    })
  })

  describe('Route Handlers', () => {
    let mockReq: any
    let mockRes: any

    beforeEach(() => {
      mockReq = {
        method: 'GET',
        path: '/test',
        body: {}
      }
      
      mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      }
    })

    test('should handle status request', async () => {
      await plugin['handleGetStatus'](mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith({
        plugin: '{{kebabName}}',
        version: '1.0.0',
        status: 'active',
        config: expect.any(Object)
      })
    })

    test('should handle ping action', async () => {
      mockReq.body = { action: 'ping' }
      
      await plugin['handleAction'](mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'pong',
        timestamp: expect.any(String)
      })
    })

    test('should handle process action', async () => {
      const testData = { test: 'data' }
      mockReq.body = { action: 'process', data: testData }
      
      await plugin['handleAction'](mockReq, mockRes)
      
      expect(mockRes.json).toHaveBeenCalledWith({
        result: expect.objectContaining({
          processed: true,
          data: testData
        })
      })
    })

    test('should handle unknown action', async () => {
      mockReq.body = { action: 'unknown' }
      
      await plugin['handleAction'](mockReq, mockRes)
      
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unknown action'
      })
    })
  })

  describe('Middleware', () => {
    test('should add plugin data to request', () => {
      const mockReq = { method: 'GET', path: '/test' }
      const mockRes = {}
      const mockNext = jest.fn()
      
      plugin['{{camelName}}Middleware'](mockReq, mockRes, mockNext)
      
      expect(mockReq).toHaveProperty('{{camelName}}')
      expect(mockReq.{{camelName}}).toEqual({
        plugin: '{{kebabName}}',
        timestamp: expect.any(String)
      })
      expect(mockNext).toHaveBeenCalled()
    })
  })

  describe('Data Processing', () => {
    test('should process data correctly', async () => {
      const testData = { input: 'test' }
      
      const result = await plugin['processData'](testData)
      
      expect(result).toEqual({
        processed: true,
        data: testData,
        timestamp: expect.any(String)
      })
    })
  })
})`
}

function getPluginDocsTemplate(): string {
  return `# {{name}} Plugin

A G1 Framework plugin for {{description}}.

## Installation

\`\`\`bash
npm install @g-1/plugin-{{kebabName}}
\`\`\`

## Usage

### Basic Usage

\`\`\`typescript
import { {{pascalName}}Plugin } from '@g-1/plugin-{{kebabName}}'

// Create plugin instance
const plugin = new {{pascalName}}Plugin({
  enableFeatureA: true,
  enableApi: true
})

// Register with G1 application
app.registerPlugin(plugin)
\`\`\`

### Configuration

The plugin accepts the following configuration options:

\`\`\`typescript
interface {{pascalName}}Config {
  // Feature toggles
  enableFeatureA: boolean      // Enable Feature A (default: true)
  enableFeatureB: boolean      // Enable Feature B (default: false)
  enableApi: boolean           // Enable API endpoints (default: true)
  enableMiddleware: boolean    // Enable middleware (default: true)
  enableScheduler: boolean     // Enable scheduler (default: false)

  // Configuration options
  apiPrefix: string           // API prefix (default: '/{{kebabName}}')
  maxRetries: number          // Max retries (default: 3)
  timeout: number             // Timeout in ms (default: 5000)

  // Custom settings
  customSettings: Record<string, any>  // Custom configuration
}
\`\`\`

### Example Configuration

\`\`\`typescript
const plugin = new {{pascalName}}Plugin({
  enableFeatureA: true,
  enableFeatureB: true,
  enableApi: true,
  apiPrefix: '/api/{{kebabName}}',
  maxRetries: 5,
  timeout: 10000,
  customSettings: {
    customOption: 'value'
  }
})
\`\`\`

## API Endpoints

When \`enableApi\` is true, the plugin exposes the following endpoints:

### GET /{{kebabName}}

Get plugin status and configuration.

**Response:**
\`\`\`json
{
  "plugin": "{{kebabName}}",
  "version": "1.0.0",
  "status": "active",
  "config": {
    "enableFeatureA": true,
    "enableFeatureB": false,
    "enableApi": true
  }
}
\`\`\`

### POST /{{kebabName}}/action

Execute plugin actions.

**Request:**
\`\`\`json
{
  "action": "ping"
}
\`\`\`

**Response:**
\`\`\`json
{
  "message": "pong",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

**Available Actions:**
- \`ping\`: Simple ping/pong test
- \`process\`: Process data (requires \`data\` field)

### GET /{{kebabName}}/api

Custom API endpoint (when \`enableApi\` is true).

## Middleware

When \`enableMiddleware\` is true, the plugin adds middleware that:

- Adds plugin information to requests under \`req.{{camelName}}\`
- Logs request processing
- Provides plugin context to route handlers

## Events

The plugin emits the following events:

- \`plugin:started\`: When the plugin starts
- \`plugin:stopped\`: When the plugin stops
- \`action:executed\`: When an action is executed
- \`error:occurred\`: When an error occurs

## Development

### Building

\`\`\`bash
npm run build
\`\`\`

### Testing

\`\`\`bash
npm test
npm run test:watch
\`\`\`

### Linting

\`\`\`bash
npm run lint
npm run lint:fix
\`\`\`

## License

MIT`
}

export default generatePlugin
