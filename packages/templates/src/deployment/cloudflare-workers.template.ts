/**
 * Cloudflare Workers deployment templates
 */

export interface CloudflareWorkersConfig {
  name?: string
  main?: string
  compatibility_date?: string
  compatibility_flags?: string[]
  vars?: Record<string, string>
  kv_namespaces?: Array<{
    binding: string
    id: string
    preview_id?: string
  }>
  durable_objects?: Array<{
    name: string
    class_name: string
    script_name?: string
  }>
  r2_buckets?: Array<{
    binding: string
    bucket_name: string
    preview_bucket_name?: string
  }>
  d1_databases?: Array<{
    binding: string
    database_name: string
    database_id: string
    preview_database_id?: string
  }>
  services?: Array<{
    binding: string
    service: string
    environment?: string
  }>
  analytics_engine_datasets?: Array<{
    binding: string
    dataset?: string
  }>
  ai?: {
    binding: string
  }
  vectorize?: Array<{
    binding: string
    index_name: string
  }>
  hyperdrive?: Array<{
    binding: string
    id: string
  }>
  queues?: Array<{
    binding: string
    queue: string
  }>
  routes?: Array<{
    pattern: string
    zone_name?: string
    zone_id?: string
    custom_domain?: boolean
  }>
  triggers?: {
    crons?: string[]
  }
  usage_model?: 'bundled' | 'unbound'
  limits?: {
    cpu_ms?: number
  }
  placement?: {
    mode?: 'smart'
  }
  tail_consumers?: Array<{
    service: string
    environment?: string
  }>
  logfwdr?: {
    bindings?: Array<{
      name: string
      destination: string
    }>
  }
}

/**
 * Default Cloudflare Workers configuration
 */
export const DEFAULT_CLOUDFLARE_CONFIG: CloudflareWorkersConfig = {
  name: 'my-api',
  main: 'src/index.ts',
  compatibility_date: '2024-01-01',
  compatibility_flags: [],
  usage_model: 'bundled',
}

/**
 * Generate wrangler.toml configuration
 */
export function generateWranglerConfig(config: CloudflareWorkersConfig): string {
  const lines: string[] = []

  // Basic configuration
  if (config.name) lines.push(`name = "${config.name}"`)
  if (config.main) lines.push(`main = "${config.main}"`)
  if (config.compatibility_date) lines.push(`compatibility_date = "${config.compatibility_date}"`)
  if (config.usage_model) lines.push(`usage_model = "${config.usage_model}"`)

  // Compatibility flags
  if (config.compatibility_flags && config.compatibility_flags.length > 0) {
    lines.push(
      `compatibility_flags = [${config.compatibility_flags.map(f => `"${f}"`).join(', ')}]`
    )
  }

  // Environment variables
  if (config.vars && Object.keys(config.vars).length > 0) {
    lines.push('\n[vars]')
    Object.entries(config.vars).forEach(([key, value]) => {
      lines.push(`${key} = "${value}"`)
    })
  }

  // KV namespaces
  if (config.kv_namespaces && config.kv_namespaces.length > 0) {
    config.kv_namespaces.forEach(kv => {
      lines.push('\n[[kv_namespaces]]')
      lines.push(`binding = "${kv.binding}"`)
      lines.push(`id = "${kv.id}"`)
      if (kv.preview_id) lines.push(`preview_id = "${kv.preview_id}"`)
    })
  }

  // Durable Objects
  if (config.durable_objects && config.durable_objects.length > 0) {
    config.durable_objects.forEach(obj => {
      lines.push('\n[[durable_objects.bindings]]')
      lines.push(`name = "${obj.name}"`)
      lines.push(`class_name = "${obj.class_name}"`)
      if (obj.script_name) lines.push(`script_name = "${obj.script_name}"`)
    })
  }

  // R2 buckets
  if (config.r2_buckets && config.r2_buckets.length > 0) {
    config.r2_buckets.forEach(bucket => {
      lines.push('\n[[r2_buckets]]')
      lines.push(`binding = "${bucket.binding}"`)
      lines.push(`bucket_name = "${bucket.bucket_name}"`)
      if (bucket.preview_bucket_name)
        lines.push(`preview_bucket_name = "${bucket.preview_bucket_name}"`)
    })
  }

  // D1 databases
  if (config.d1_databases && config.d1_databases.length > 0) {
    config.d1_databases.forEach(db => {
      lines.push('\n[[d1_databases]]')
      lines.push(`binding = "${db.binding}"`)
      lines.push(`database_name = "${db.database_name}"`)
      lines.push(`database_id = "${db.database_id}"`)
      if (db.preview_database_id) lines.push(`preview_database_id = "${db.preview_database_id}"`)
    })
  }

  // Services
  if (config.services && config.services.length > 0) {
    config.services.forEach(service => {
      lines.push('\n[[services]]')
      lines.push(`binding = "${service.binding}"`)
      lines.push(`service = "${service.service}"`)
      if (service.environment) lines.push(`environment = "${service.environment}"`)
    })
  }

  // Analytics Engine
  if (config.analytics_engine_datasets && config.analytics_engine_datasets.length > 0) {
    config.analytics_engine_datasets.forEach(dataset => {
      lines.push('\n[[analytics_engine_datasets]]')
      lines.push(`binding = "${dataset.binding}"`)
      if (dataset.dataset) lines.push(`dataset = "${dataset.dataset}"`)
    })
  }

  // AI binding
  if (config.ai) {
    lines.push('\n[ai]')
    lines.push(`binding = "${config.ai.binding}"`)
  }

  // Vectorize
  if (config.vectorize && config.vectorize.length > 0) {
    config.vectorize.forEach(vector => {
      lines.push('\n[[vectorize]]')
      lines.push(`binding = "${vector.binding}"`)
      lines.push(`index_name = "${vector.index_name}"`)
    })
  }

  // Hyperdrive
  if (config.hyperdrive && config.hyperdrive.length > 0) {
    config.hyperdrive.forEach(hyper => {
      lines.push('\n[[hyperdrive]]')
      lines.push(`binding = "${hyper.binding}"`)
      lines.push(`id = "${hyper.id}"`)
    })
  }

  // Queues
  if (config.queues && config.queues.length > 0) {
    config.queues.forEach(queue => {
      lines.push('\n[[queues.producers]]')
      lines.push(`binding = "${queue.binding}"`)
      lines.push(`queue = "${queue.queue}"`)
    })
  }

  // Routes
  if (config.routes && config.routes.length > 0) {
    config.routes.forEach(route => {
      lines.push('\n[[routes]]')
      lines.push(`pattern = "${route.pattern}"`)
      if (route.zone_name) lines.push(`zone_name = "${route.zone_name}"`)
      if (route.zone_id) lines.push(`zone_id = "${route.zone_id}"`)
      if (route.custom_domain) lines.push(`custom_domain = ${route.custom_domain}`)
    })
  }

  // Triggers
  if (config.triggers?.crons && config.triggers.crons.length > 0) {
    lines.push('\n[triggers]')
    lines.push(`crons = [${config.triggers.crons.map(c => `"${c}"`).join(', ')}]`)
  }

  // Limits
  if (config.limits?.cpu_ms) {
    lines.push('\n[limits]')
    lines.push(`cpu_ms = ${config.limits.cpu_ms}`)
  }

  // Placement
  if (config.placement?.mode) {
    lines.push('\n[placement]')
    lines.push(`mode = "${config.placement.mode}"`)
  }

  return lines.join('\n')
}

/**
 * Cloudflare Workers entry point template
 */
export const CLOUDFLARE_ENTRY_TEMPLATE = `import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'

// Import your routes
import { routes } from './routes'

// Cloudflare Workers bindings interface
export interface Env {
  // KV namespaces
  MY_KV: KVNamespace
  
  // D1 databases
  DB: D1Database
  
  // R2 buckets
  MY_BUCKET: R2Bucket
  
  // Environment variables
  JWT_SECRET: string
  API_KEY: string
  
  // Durable Objects
  MY_DURABLE_OBJECT: DurableObjectNamespace
  
  // AI binding
  AI: Ai
  
  // Analytics Engine
  ANALYTICS: AnalyticsEngineDataset
  
  // Queues
  MY_QUEUE: Queue
}

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors())
app.use('*', logger())
app.use('*', prettyJSON())

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: c.env
  })
})

// API routes
app.route('/api', routes)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ 
    error: 'Internal Server Error',
    message: err.message 
  }, 500)
})

export default app`

/**
 * Package.json scripts for Cloudflare Workers
 */
export const CLOUDFLARE_SCRIPTS = {
  dev: 'wrangler dev',
  deploy: 'wrangler deploy',
  'deploy:staging': 'wrangler deploy --env staging',
  'deploy:production': 'wrangler deploy --env production',
  tail: 'wrangler tail',
  'kv:list': 'wrangler kv:namespace list',
  'kv:create': 'wrangler kv:namespace create',
  'd1:create': 'wrangler d1 create',
  'd1:migrations:list': 'wrangler d1 migrations list',
  'd1:migrations:apply': 'wrangler d1 migrations apply',
  'r2:create': 'wrangler r2 bucket create',
  'r2:list': 'wrangler r2 bucket list',
  publish: 'wrangler deploy --minify',
  preview: 'wrangler dev --remote',
}

/**
 * Cloudflare Workers dependencies
 */
export const CLOUDFLARE_DEPENDENCIES = {
  dependencies: {
    hono: '^4.0.0',
  },
  devDependencies: {
    '@cloudflare/workers-types': '^4.20240117.0',
    wrangler: '^3.0.0',
    typescript: '^5.0.0',
    '@types/node': '^20.0.0',
  },
}

/**
 * TypeScript configuration for Cloudflare Workers
 */
export const CLOUDFLARE_TSCONFIG = {
  compilerOptions: {
    target: 'ES2022',
    lib: ['ES2022'],
    module: 'ESNext',
    moduleResolution: 'bundler',
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    allowJs: true,
    checkJs: false,
    strict: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,
    types: ['@cloudflare/workers-types'],
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist'],
}

/**
 * Predefined Cloudflare Workers configurations
 */
export const CLOUDFLARE_CONFIGS = {
  /**
   * Basic API configuration
   */
  basicAPI: (name: string): CloudflareWorkersConfig => ({
    name,
    main: 'src/index.ts',
    compatibility_date: '2024-01-01',
    usage_model: 'bundled',
    vars: {
      NODE_ENV: 'production',
    },
  }),

  /**
   * Full-stack application with database
   */
  fullStack: (name: string, dbId: string): CloudflareWorkersConfig => ({
    name,
    main: 'src/index.ts',
    compatibility_date: '2024-01-01',
    usage_model: 'bundled',
    d1_databases: [
      {
        binding: 'DB',
        database_name: `${name}-db`,
        database_id: dbId,
      },
    ],
    kv_namespaces: [
      {
        binding: 'CACHE',
        id: 'your-kv-namespace-id',
      },
    ],
    vars: {
      NODE_ENV: 'production',
      JWT_SECRET: 'your-jwt-secret',
    },
  }),

  /**
   * AI-powered application
   */
  aiApp: (name: string): CloudflareWorkersConfig => ({
    name,
    main: 'src/index.ts',
    compatibility_date: '2024-01-01',
    usage_model: 'unbound',
    ai: {
      binding: 'AI',
    },
    vectorize: [
      {
        binding: 'VECTORIZE',
        index_name: `${name}-vectors`,
      },
    ],
    vars: {
      NODE_ENV: 'production',
    },
  }),

  /**
   * File storage application
   */
  fileStorage: (name: string, bucketName: string): CloudflareWorkersConfig => ({
    name,
    main: 'src/index.ts',
    compatibility_date: '2024-01-01',
    usage_model: 'bundled',
    r2_buckets: [
      {
        binding: 'STORAGE',
        bucket_name: bucketName,
      },
    ],
    vars: {
      NODE_ENV: 'production',
      MAX_FILE_SIZE: '10485760', // 10MB
    },
  }),

  /**
   * Scheduled worker (cron jobs)
   */
  scheduled: (name: string, crons: string[]): CloudflareWorkersConfig => ({
    name,
    main: 'src/index.ts',
    compatibility_date: '2024-01-01',
    usage_model: 'bundled',
    triggers: {
      crons,
    },
    vars: {
      NODE_ENV: 'production',
    },
  }),

  /**
   * Multi-environment setup
   */
  multiEnvironment: (name: string): CloudflareWorkersConfig => ({
    name: `${name}-production`,
    main: 'src/index.ts',
    compatibility_date: '2024-01-01',
    usage_model: 'bundled',
    vars: {
      NODE_ENV: 'production',
    },
  }),
}

/**
 * Environment-specific configurations
 */
export function generateEnvironmentConfig(
  baseConfig: CloudflareWorkersConfig,
  environment: 'development' | 'staging' | 'production'
): string {
  const envConfig = { ...baseConfig }

  // Update name for environment
  if (envConfig.name) {
    envConfig.name = `${envConfig.name}-${environment}`
  }

  // Environment-specific variables
  envConfig.vars = {
    ...envConfig.vars,
    NODE_ENV: environment,
    ENVIRONMENT: environment,
  }

  // Use preview resources for non-production
  if (environment !== 'production') {
    if (envConfig.kv_namespaces) {
      envConfig.kv_namespaces = envConfig.kv_namespaces.map(kv => ({
        ...kv,
        preview_id: kv.preview_id || `${kv.id}-preview`,
      }))
    }

    if (envConfig.d1_databases) {
      envConfig.d1_databases = envConfig.d1_databases.map(db => ({
        ...db,
        preview_database_id: db.preview_database_id || `${db.database_id}-preview`,
      }))
    }

    if (envConfig.r2_buckets) {
      envConfig.r2_buckets = envConfig.r2_buckets.map(bucket => ({
        ...bucket,
        preview_bucket_name: bucket.preview_bucket_name || `${bucket.bucket_name}-preview`,
      }))
    }
  }

  return generateWranglerConfig(envConfig)
}

/**
 * Deployment helpers
 */
export const CLOUDFLARE_HELPERS = {
  /**
   * Generate GitHub Actions workflow
   */
  githubActions: (_name: string) => `name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env \${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}`,

  /**
   * Generate secrets setup script
   */
  secretsSetup: () => `#!/bin/bash
# Setup Cloudflare Workers secrets

echo "Setting up Cloudflare Workers secrets..."

# Set JWT secret
wrangler secret put JWT_SECRET

# Set database URL (if using external DB)
wrangler secret put DATABASE_URL

# Set API keys
wrangler secret put EXTERNAL_API_KEY

# Set email service credentials
wrangler secret put SMTP_PASSWORD

echo "Secrets setup complete!"`,

  /**
   * Generate local development setup
   */
  devSetup: () => `# Cloudflare Workers Development Setup

## Prerequisites
- Node.js 18+
- Wrangler CLI

## Setup
1. Install Wrangler: \`npm install -g wrangler\`
2. Login to Cloudflare: \`wrangler auth login\`
3. Install dependencies: \`npm install\`
4. Start development server: \`npm run dev\`

## Commands
- \`npm run dev\` - Start local development server
- \`npm run deploy\` - Deploy to production
- \`npm run deploy:staging\` - Deploy to staging
- \`npm run tail\` - View live logs

## Environment Variables
Copy \`.env.example\` to \`.env.local\` and fill in your values.`,
}

/**
 * Usage examples
 */
export const CLOUDFLARE_EXAMPLES = {
  basic: `// Basic Cloudflare Workers setup
import { generateWranglerConfig, CLOUDFLARE_CONFIGS } from './cloudflare-workers.template'

// Generate basic API configuration
const config = CLOUDFLARE_CONFIGS.basicAPI('my-api')
const wranglerToml = generateWranglerConfig(config)

console.log(wranglerToml)`,

  fullStack: `// Full-stack application with D1 database
import { CLOUDFLARE_CONFIGS, generateEnvironmentConfig } from './cloudflare-workers.template'

// Production configuration
const prodConfig = CLOUDFLARE_CONFIGS.fullStack('my-app', 'your-d1-database-id')
const prodWrangler = generateEnvironmentConfig(prodConfig, 'production')

// Staging configuration
const stagingWrangler = generateEnvironmentConfig(prodConfig, 'staging')`,

  aiPowered: `// AI-powered application
import { CLOUDFLARE_CONFIGS } from './cloudflare-workers.template'

const aiConfig = CLOUDFLARE_CONFIGS.aiApp('ai-assistant')
const wranglerToml = generateWranglerConfig(aiConfig)`,
}

export default {
  generateWranglerConfig,
  generateEnvironmentConfig,
  CLOUDFLARE_CONFIGS,
  CLOUDFLARE_HELPERS,
  CLOUDFLARE_ENTRY_TEMPLATE,
  CLOUDFLARE_SCRIPTS,
  CLOUDFLARE_DEPENDENCIES,
  CLOUDFLARE_TSCONFIG,
  DEFAULT_CLOUDFLARE_CONFIG,
}
