import path from 'node:path'
import fs from 'fs-extra'
import type { CreateProjectOptions, TemplateVariables } from '../types/index.js'
import { initializeGit } from '../utils/git.js'
import { logger } from '../utils/logger.js'
import { installDependencies } from '../utils/package-manager.js'

/**
 * Create a new G1 project from template
 */
export async function createProject(options: CreateProjectOptions): Promise<void> {
  const {
    name,
    template,
    directory = process.cwd(),
    packageManager = 'bun',
    git = true,
    install = true,
    typescript = true,
    eslint = true,
    prettier = true,
  } = options

  const projectPath = path.resolve(directory, name)

  try {
    logger.startSpinner('Creating project structure...')

    // Ensure target directory doesn't exist or is empty
    if (await fs.pathExists(projectPath)) {
      const files = await fs.readdir(projectPath)
      if (files.length > 0) {
        throw new Error(`Directory ${projectPath} is not empty`)
      }
    } else {
      await fs.ensureDir(projectPath)
    }

    // Prepare template variables
    const templateVars: TemplateVariables = {
      projectName: name,
      packageName: name,
      description: `A G1 API Framework project`,
      author: 'Your Name',
      license: 'MIT',
      typescript,
      eslint,
      prettier,
      packageManager,
    }

    // Generate project based on template
    switch (template) {
      case 'api':
        await generateApiProject(projectPath, templateVars)
        break
      case 'minimal':
        await generateMinimalProject(projectPath, templateVars)
        break
      case 'plugin':
        await generatePluginProject(projectPath, templateVars)
        break
      default:
        throw new Error(`Unknown template: ${template}`)
    }

    logger.succeedSpinner('Project structure created')

    // Initialize git repository
    if (git) {
      logger.startSpinner('Initializing git repository...')
      await initializeGit(projectPath)
      logger.succeedSpinner('Git repository initialized')
    }

    // Install dependencies
    if (install) {
      logger.startSpinner('Installing dependencies...')
      await installDependencies(projectPath, packageManager)
      logger.succeedSpinner('Dependencies installed')
    }
  } catch (error) {
    logger.failSpinner('Failed to create project')
    throw error
  }
}

/**
 * Generate a full API project
 */
async function generateApiProject(projectPath: string, vars: TemplateVariables): Promise<void> {
  // Create package.json
  const packageJson = {
    name: vars.packageName,
    version: '0.1.0',
    description: vars.description,
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      dev: 'bun run --watch src/index.ts',
      build: 'bun build src/index.ts --outdir dist --target node',
      start: 'node dist/index.js',
      test: 'vitest',
      'test:watch': 'vitest --watch',
      'test:coverage': 'vitest --coverage',
      lint: 'eslint src --ext .ts',
      'lint:fix': 'eslint src --ext .ts --fix',
      format: 'prettier --write src/**/*.ts',
      'format:check': 'prettier --check src/**/*.ts',
      'db:generate': 'drizzle-kit generate',
      'db:migrate': 'drizzle-kit migrate',
      'db:studio': 'drizzle-kit studio',
    },
    dependencies: {
      '@g-1/core': '^1.15.11',
      '@g-1/util': '^1.0.0',
      '@hono/zod-openapi': '^1.1.4',
      'drizzle-orm': '^0.44.6',
      hono: '^4.10.1',
      zod: '^4.1.12',
      '@libsql/client': '^0.10.0',
    },
    devDependencies: {
      '@types/node': '^20.8.0',
      typescript: '^5.2.2',
      vitest: '^0.34.6',
      'drizzle-kit': '^0.20.0',
      ...(vars.eslint && {
        eslint: '^8.51.0',
        '@typescript-eslint/eslint-plugin': '^6.7.4',
        '@typescript-eslint/parser': '^6.7.4',
      }),
      ...(vars.prettier && {
        prettier: '^3.0.3',
      }),
    },
    engines: {
      node: '>=18.0.0',
      bun: '>=1.0.0',
    },
    packageManager: `${vars.packageManager}@latest`,
  }

  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 })

  // Create TypeScript config
  if (vars.typescript) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        strict: true,
        skipLibCheck: true,
        declaration: true,
        outDir: './dist',
        rootDir: './src',
        resolveJsonModule: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', '**/*.test.ts'],
    }

    await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 })
  }

  // Create source files
  await fs.ensureDir(path.join(projectPath, 'src'))

  // Main application file
  const appContent = `import { createRouter, configureOpenAPI, onError, notFound } from '@g-1/core'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

// Create the main application using G1's createRouter
const app = createRouter()

// Configure OpenAPI documentation
configureOpenAPI(app)

// Global middleware
app.use('*', logger())
app.use('*', cors())

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to ${vars.projectName}!',
    timestamp: new Date().toISOString(),
  })
})

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

// Error handling
app.onError(onError)
app.notFound(notFound)

export default {
  port: process.env.PORT || 3000,
  fetch: app.fetch,
}
`

  await fs.writeFile(path.join(projectPath, 'src/index.ts'), appContent)

  // Create environment file
  const envContent = `# Database
DATABASE_URL="file:./local.db"

# Server
PORT=3000
NODE_ENV=development

# Add your environment variables here
`

  await fs.writeFile(path.join(projectPath, '.env.example'), envContent)

  // Create README
  const readmeContent = `# ${vars.projectName}

${vars.description}

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0

### Installation

1. Install dependencies:
   \`\`\`bash
   ${vars.packageManager} install
   \`\`\`

2. Copy environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Start the development server:
   \`\`\`bash
   ${vars.packageManager} run dev
   \`\`\`

The server will start on http://localhost:3000

## Available Scripts

- \`${vars.packageManager} run dev\` - Start development server with hot reload
- \`${vars.packageManager} run build\` - Build for production
- \`${vars.packageManager} run start\` - Start production server
- \`${vars.packageManager} run test\` - Run tests
- \`${vars.packageManager} run lint\` - Lint code
- \`${vars.packageManager} run format\` - Format code

## Project Structure

\`\`\`
src/
├── index.ts          # Main application entry point
└── ...               # Add your modules here
\`\`\`

## Built with G1 Framework

This project is built using the [G1 API Framework](https://github.com/g1-studio/api-framework), providing:

- 🚀 Fast development with Bun and Hono
- 🔌 Plugin system for extensibility
- 🛡️ Built-in security and middleware
- 📊 Database integration with Drizzle ORM
- 🧪 Testing setup with Vitest
- 📝 TypeScript support

## License

${vars.license}
`

  await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent)

  // Create .gitignore
  const gitignoreContent = `# Dependencies
node_modules/
bun.lockb

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.production

# Database
*.db
*.db-journal

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Temporary files
tmp/
temp/
`

  await fs.writeFile(path.join(projectPath, '.gitignore'), gitignoreContent)

  // Create ESLint config if enabled
  if (vars.eslint) {
    const eslintConfig = {
      parser: '@typescript-eslint/parser',
      extends: ['eslint:recommended', '@typescript-eslint/recommended'],
      plugins: ['@typescript-eslint'],
      env: {
        node: true,
        es2022: true,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    }

    await fs.writeJson(path.join(projectPath, '.eslintrc.json'), eslintConfig, { spaces: 2 })
  }

  // Create Prettier config if enabled
  if (vars.prettier) {
    const prettierConfig = {
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5' as const,
      printWidth: 100,
    }

    await fs.writeJson(path.join(projectPath, '.prettierrc.json'), prettierConfig, { spaces: 2 })
  }
}

/**
 * Generate a minimal project
 */
async function generateMinimalProject(projectPath: string, vars: TemplateVariables): Promise<void> {
  // Simplified version of API project with minimal dependencies
  const packageJson = {
    name: vars.packageName,
    version: '0.1.0',
    description: vars.description,
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      dev: 'bun run --watch src/index.ts',
      build: 'bun build src/index.ts --outdir dist --target node',
      start: 'node dist/index.js',
      test: 'vitest',
    },
    dependencies: {
      '@g-1/core': '^1.15.9',
      '@g-1/util': '^1.0.0',
      hono: '^4.10.1',
    },
    devDependencies: {
      '@types/node': '^20.8.0',
      typescript: '^5.2.2',
      vitest: '^0.34.6',
    },
    engines: {
      node: '>=18.0.0',
      bun: '>=1.0.0',
    },
    packageManager: `${vars.packageManager}@latest`,
  }

  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 })

  // Simple app file
  await fs.ensureDir(path.join(projectPath, 'src'))

  const appContent = `import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'Hello from ${vars.projectName}!' })
})

export default app

if (import.meta.main) {
  const port = process.env.PORT || 3000
  console.log(\`Server running on port \${port}\`)
  
  Bun.serve({
    port,
    fetch: app.fetch,
  })
}
`

  await fs.writeFile(path.join(projectPath, 'src/index.ts'), appContent)

  // Basic README
  const readmeContent = `# ${vars.projectName}

A minimal G1 API Framework project.

## Quick Start

\`\`\`bash
${vars.packageManager} install
${vars.packageManager} run dev
\`\`\`
`

  await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent)
}

/**
 * Generate a plugin project
 */
async function generatePluginProject(projectPath: string, vars: TemplateVariables): Promise<void> {
  const packageJson = {
    name: vars.packageName,
    version: '0.1.0',
    description: `A G1 Framework plugin`,
    type: 'module',
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      dev: 'tsc --watch',
      test: 'vitest',
    },
    dependencies: {
      '@g-1/core': '^1.15.9',
      '@g-1/util': '^1.0.0',
    },
    devDependencies: {
      '@types/node': '^20.8.0',
      typescript: '^5.2.2',
      vitest: '^0.34.6',
    },
    peerDependencies: {
      hono: '^4.10.1',
    },
    engines: {
      node: '>=18.0.0',
    },
    packageManager: `${vars.packageManager}@latest`,
  }

  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 })

  // Plugin source
  await fs.ensureDir(path.join(projectPath, 'src'))

  const pluginContent = `import { createPlugin } from '@g-1/core'

export const ${vars.projectName.replace(/-/g, '')}Plugin = createPlugin({
  name: '${vars.projectName}',
  version: '0.1.0',
  description: '${vars.description}',
  
  async onMount(app) {
    // Plugin initialization logic
    console.log('${vars.projectName} plugin mounted')
  },
  
  routes(app) {
    // Add plugin routes
    app.get('/plugin/${vars.projectName}', (c) => {
      return c.json({ plugin: '${vars.projectName}', status: 'active' })
    })
  },
})

export default ${vars.projectName.replace(/-/g, '')}Plugin
`

  await fs.writeFile(path.join(projectPath, 'src/index.ts'), pluginContent)
}
