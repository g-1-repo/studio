# API Framework Architecture Guide

## Overview

This document captures the architectural decisions, patterns, and design principles for transforming the G1 Studio API boilerplate into a comprehensive, plugin-first API framework. This guide serves as the definitive reference for maintaining consistency and avoiding architectural drift.

## Table of Contents

1. [Core Architectural Principles](#core-architectural-principles)
2. [Plugin-First Architecture](#plugin-first-architecture)
3. [Domain Structure Pattern](#domain-structure-pattern)
4. [Middleware → Plugin Transformation](#middleware--plugin-transformation)
5. [Database Abstraction Layer](#database-abstraction-layer)
6. [Shared Models Strategy](#shared-models-strategy)
7. [Migration and Update Strategy](#migration-and-update-strategy)
8. [Framework vs Boilerplate Boundaries](#framework-vs-boilerplate-boundaries)
9. [Development Workflow](#development-workflow)
10. [Decision Log](#decision-log)

## Core Architectural Principles

### 1. Plugin-First Design
- **Core Framework**: Minimal, essential functionality only
- **Everything Else**: Optional plugins that can be added/removed
- **No Vendor Lock-in**: Plugins should be swappable
- **Developer Choice**: Let developers choose their stack

### 2. Clear Separation of Concerns
- **Framework** (`@g-1/core`): Abstract interfaces, plugin system, essential utilities
- **Templates** (`@g-1/templates`): Concrete implementations, boilerplate code
- **CLI** (`@g-1/cli`): Scaffolding, plugin management, migrations
- **Models** (`@g-1/models`): Shared TypeScript interfaces

### 3. OpenAPI-First Development
- All routes must be defined with OpenAPI specifications
- Type safety through Zod schemas
- Automatic documentation generation
- Contract-first API development

### 4. Developer Experience Priority
- Minimal configuration required
- Intuitive CLI commands
- Clear error messages
- Comprehensive examples

## Plugin-First Architecture

### Core Framework (`@g-1/core`)

**Minimal Essential Components:**
```typescript
// Essential middleware (cannot be plugins)
- contextStorage     // Request context management
- requestId         // Request tracking
- notFound          // 404 handler
- onError           // Global error handler

// Plugin System
- PluginManager     // Plugin lifecycle management
- IPlugin           // Plugin interface
- PluginRegistry    // Plugin discovery and loading
```

**Plugin Interface:**
```typescript
interface IPlugin {
  name: string
  version: string
  dependencies?: string[]
  
  // Lifecycle hooks
  onRegister?(app: HonoApp): void | Promise<void>
  onMount?(app: HonoApp): void | Promise<void>
  onUnmount?(app: HonoApp): void | Promise<void>
  
  // Configuration
  config?: PluginConfig
  middleware?: MiddlewareHandler[]
}
```

### Standard Plugins

**Security Plugin** (`@g-1/plugin-security`):
- Enhanced security headers
- Input sanitization
- Security audit logging

**Rate Limiting Plugin** (`@g-1/plugin-rate-limit`):
- Configurable rate limiting
- Multiple strategies (memory, Redis, etc.)

**Logging Plugin** (`@g-1/plugin-pino-logger`):
- Structured logging with Pino
- Request/response logging
- Performance metrics

**CORS Plugin** (`@g-1/plugin-cors`):
- Configurable CORS policies
- Environment-specific settings

**Validation Plugin** (`@g-1/plugin-validation`):
- Request validation middleware
- Schema-based validation

### Plugin Management

**CLI Commands:**
```bash
# Plugin management
npx @g-1/cli add plugin-name
npx @g-1/cli remove plugin-name
npx @g-1/cli list plugins
npx @g-1/cli update plugin-name

# Plugin development
npx @g-1/cli create plugin my-plugin
npx @g-1/cli publish plugin
```

**Application Configuration:**
```typescript
// app.config.ts
export default {
  plugins: [
    '@g-1/plugin-pino-logger',
    '@g-1/plugin-security',
    '@g-1/plugin-rate-limit',
    {
      name: '@g-1/plugin-cors',
      config: {
        origin: ['https://myapp.com'],
        credentials: true
      }
    }
  ]
}
```

## Domain Structure Pattern

### Recommended Structure
```
domain/
├── domain-services/     # Business logic services (folder for complex domains)
├── handlers.ts         # Route handlers (file for most cases)
├── index.ts           # Router assembly
├── repository.ts      # Data access layer
└── routes.ts          # OpenAPI route definitions
```

### When to Use Folders vs Files

**Use `handlers.ts` (file) when:**
- ✅ Simple CRUD operations
- ✅ 3-8 handlers per domain
- ✅ Handlers are thin controllers
- ✅ No complex handler logic

**Use `handlers/` (folder) when:**
- ❌ 10+ handlers
- ❌ Handlers with complex logic (100+ lines each)
- ❌ Multiple handler categories (admin vs user vs public)
- ❌ Shared handler utilities

**Use `domain-services/` (folder) when:**
- Complex business logic
- Multiple service classes
- Shared service utilities
- Domain-specific integrations

### File Responsibilities

**`routes.ts`** - OpenAPI Route Definitions:
```typescript
import { createRoute, z } from '@hono/zod-openapi'

export const create = createRoute({
  path: '/users',
  method: 'post',
  tags: ['Users'],
  request: {
    body: jsonContentRequired(createUserSchema, 'User data')
  },
  responses: {
    [CREATED]: jsonContent(userSchema, 'Created user'),
    [UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'Validation errors')
  }
})
```

**`handlers.ts`** - Route Handlers:
```typescript
import type { CreateRoute } from './users.routes'
import type { AppRouteHandler } from '@/lib/types'

export const create: AppRouteHandler<CreateRoute> = async (c) => {
  const userData = c.req.valid('json')
  const user = await userService.create(userData, c.env)
  return c.json(user, CREATED)
}
```

**`repository.ts`** - Data Access Layer:
```typescript
export class UserRepository extends BaseRepository {
  async create(data: CreateUser, env: Environment) {
    return this.executeQuery(env, async ({ db }) => {
      return await db.insert(usersTable).values(data).returning()
    }, 'create')
  }
}
```

**`domain-services/`** - Business Logic:
```typescript
export class UserService extends BaseService {
  async create(userData: CreateUser, env: Environment) {
    return this.executeOperation('create', async () => {
      // Validation, business rules, external integrations
      const user = await this.userRepository.create(userData, env)
      await this.emailService.sendWelcome(user.email)
      return user
    })
  }
}
```

**`index.ts`** - Router Assembly:
```typescript
import { createRouter } from '@/lib/create-app'
import * as handlers from './users.handlers'
import * as routes from './users.routes'

const router = createRouter()
  .openapi(routes.create, handlers.create)
  .openapi(routes.getById, handlers.getById)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove)

export default router
```

## Middleware → Plugin Transformation

### Current Middleware Analysis

**Essential (Stay in Core):**
- `contextStorage` - Request context management
- `requestId` - Request tracking
- `notFound` - 404 handler
- `onError` - Global error handler

**Convert to Plugins:**
- `pinoLogger` → `@g-1/plugin-pino-logger`
- `simpleRateLimit` → `@g-1/plugin-rate-limit`
- `enhancedSecurityHeaders` → `@g-1/plugin-security`
- `cors` → `@g-1/plugin-cors`
- `requestValidation` → `@g-1/plugin-validation`

### Migration Strategy

1. **Extract middleware to plugins** while maintaining backward compatibility
2. **Create plugin interfaces** that match current middleware APIs
3. **Update application configuration** to use plugin system
4. **Provide migration guide** for existing applications

## Database Abstraction Layer

### Framework Layer (`@g-1/core`)

**Abstract Interfaces:**
```typescript
// Database abstraction
export interface IDatabaseAdapter {
  connect(config: DatabaseConfig): Promise<void>
  disconnect(): Promise<void>
  query<T>(sql: string, params?: any[]): Promise<T[]>
  transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T>
}

// Repository base class
export abstract class BaseRepository {
  protected abstract adapter: IDatabaseAdapter
  
  protected async executeQuery<T>(
    env: Environment,
    operation: (context: DatabaseContext) => Promise<T>,
    operationName: string
  ): Promise<T> {
    // Performance monitoring, error handling, caching
  }
}
```

### Template Layer (`@g-1/templates`)

**Concrete Implementations:**
```
templates/database/
├── drizzle-sqlite/     # Drizzle + SQLite implementation
├── drizzle-postgres/   # Drizzle + PostgreSQL implementation
├── prisma-postgres/    # Prisma + PostgreSQL implementation
└── kysely-mysql/       # Kysely + MySQL implementation
```

**Usage:**
```bash
# Choose database implementation
npx @g-1/cli add template database drizzle-sqlite
npx @g-1/cli add template database prisma-postgres
```

## Shared Models Strategy

### Models Package (`@g-1/models`)

**Purpose:**
- Shared TypeScript interfaces across API, frontend, and testing
- Single source of truth for data structures
- Type safety across the entire ecosystem
- **Separate package** for minimal frontend bundle size

**Key Benefits:**
- **Frontend Independence**: Frontends only install `@g-1/models` without API dependencies
- **Minimal Bundle Size**: Pure TypeScript interfaces with no runtime dependencies
- **Cross-Ecosystem Usage**: Shared between API, React/Vue frontends, mobile apps, testing

**Package Structure:**
```typescript
// @g-1/models/src/user.ts
export interface IUser {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface ICreateUser {
  email: string
  name: string
  password: string
}

export interface IUpdateUser {
  name?: string
  email?: string
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}
```

**Usage Across Ecosystem:**
```typescript
// API (backend) - Uses models + framework
import { IUser, ICreateUser } from '@g-1/models'

// Frontend (React/Vue) - Only needs models
import { IUser } from '@g-1/models'
// Frontend package.json only has: "@g-1/models": "^1.0.0"

// Mobile App - Type safety across platforms
import { IUser } from '@g-1/models'

// Testing - Consistent types
import { IUser } from '@g-1/models'
```

**Package Dependencies Flow:**
```
Frontend App
    ↓ (only depends on)
@g-1/models (pure TypeScript interfaces)

API App  
    ↓ (depends on)
@g-1/core + @g-1/models + plugins

Testing
    ↓ (depends on)  
@g-1/models (for type safety)
```

## Migration and Update Strategy

### Interactive Migration System

**Migration Templates:**
```
migrations/templates/
├── auth/               # Authentication system updates
├── database/           # Database schema changes
├── plugins/            # Plugin additions/updates
├── config/             # Configuration changes
└── dependencies/       # Dependency updates
```

**Migration Process:**
```bash
# Check for available updates
npx @g-1/cli migrate check

# Interactive migration
npx @g-1/cli migrate
# → Shows diff of changes
# → Asks for user confirmation
# → Creates backup
# → Applies changes
# → Runs tests
# → Provides rollback option
```

**Maintenance Mode:**
```typescript
// @g-1/core/maintenance
export class MaintenanceMode {
  static async enable(reason: string): Promise<void>
  static async disable(): Promise<void>
  static isEnabled(): boolean
  
  // Middleware that shows maintenance page
  static middleware(): MiddlewareHandler
}
```

### Safety Features

- **Backup Creation**: Automatic backup before migrations
- **Rollback Support**: Easy rollback to previous version
- **Dry Run Mode**: Preview changes without applying
- **Manual Review**: Show diffs and require confirmation
- **Conflict Resolution**: Handle merge conflicts gracefully

## Framework vs Boilerplate Boundaries

### Framework Responsibilities (`@g-1/core`)
- Plugin system and lifecycle management
- Abstract interfaces and base classes
- Essential utilities and helpers
- Type definitions and contracts

### Template Responsibilities (`@g-1/templates`)
- Concrete implementations
- Boilerplate code generation
- Integration examples
- Configuration templates

### CLI Responsibilities (`@g-1/cli`)
- Project scaffolding
- Plugin management
- Migration orchestration
- Development utilities

## Development Workflow

### For Framework Users

1. **Initialize Project:**
   ```bash
   npx @g-1/cli create my-api
   cd my-api
   ```

2. **Add Plugins:**
   ```bash
   npx @g-1/cli add plugin-security
   npx @g-1/cli add plugin-rate-limit
   ```

3. **Generate Domain:**
   ```bash
   npx @g-1/cli generate domain users
   ```

4. **Add Database:**
   ```bash
   npx @g-1/cli add template database drizzle-sqlite
   ```

### For Framework Contributors

1. **Plugin Development:**
   ```bash
   npx @g-1/cli create plugin my-plugin
   ```

2. **Template Development:**
   ```bash
   npx @g-1/cli create template my-template
   ```

## Monorepo Structure

### Proposed Final Structure

```
g1-studio/                     # Workspace root
├── api-framework/             # Main API framework monorepo
│   └── packages/              # Framework packages
│       ├── core/              # @g-1/core (main framework)
│       ├── cli/               # @g-1/cli (scaffolding tool)
│       ├── example/           # @g-1/example (example application)
│       ├── templates/         # @g-1/templates (code templates)
│       ├── util/              # @g-1/util (utility functions)
│       └── starters/          # Complete starter projects (empty)
├── devtools/                  # Development tools
│   └── packages/
│       ├── util/              # @g-1/util (foundation utilities)
│       ├── workflow/          # @g-1/workflow (release automation)
│       └── test/              # @g-1/test (testing framework)
├── docs/                      # Documentation site
└── README.md
```

### Testing Strategy Clarification

**Integration Tests (`/integration-tests/`)**
- **Purpose**: Test framework packages from a consumer's perspective
- **Scope**: Package installation, CLI functionality, basic API creation
- **Target**: Ensure packages work correctly when installed by end users
- **Example**: Verify `@g-1/core` installs correctly, CLI creates projects, basic imports work

**G1 Test Framework (`/devtools/packages/test/`)**
- **Purpose**: Reusable testing utilities and framework for all G1 services
- **Scope**: Comprehensive test suite, utilities, mocks, fixtures
- **Target**: Provide consistent testing tools across the G1 ecosystem
- **Example**: Database testing utilities, API testing helpers, mock services

**Key Differences:**
- Integration tests = "Does the package work for users?"
- G1 test framework = "Reusable tools for testing G1 services"

### Architecture Decisions

**AD-001: Plugin-First Architecture**
- **Decision**: Convert existing middleware to optional plugins
- **Rationale**: Flexibility, modularity, developer choice
- **Status**: Approved
- **Date**: 2024-01-XX

**AD-002: Domain Structure Pattern**
- **Decision**: Use `handlers.ts` (file) as default, scale to `handlers/` (folder) when needed
- **Rationale**: Simplicity first, scale when complexity demands
- **Status**: Approved
- **Date**: 2024-01-XX

**AD-003: Database Abstraction Layer**
- **Decision**: Abstract interfaces in core, concrete implementations in templates
- **Rationale**: Framework/boilerplate separation, flexibility
- **Status**: Approved
- **Date**: 2024-01-XX

**AD-004: Shared Models Package**
- **Decision**: Separate `@g-1/models` package for cross-ecosystem types
- **Rationale**: Type safety, single source of truth, ecosystem consistency
- **Status**: Approved
- **Date**: 2024-01-XX

**AD-005: Early Access Request as Example**
- **Decision**: Move current early access implementation to examples
- **Rationale**: Perfect demonstration of domain structure pattern
- **Status**: Approved
- **Date**: 2024-01-XX

**AD-006: Integration Tests vs G1 Test Framework**
- **Decision**: Separate integration tests from G1 test framework, rename test-package to integration-tests
- **Rationale**: Clear separation between "testing the framework packages" vs "reusable testing tools"
- **Status**: Approved
- **Date**: 2024-01-XX

**AD-007: MCP Server Integration**
- **Decision**: Include Model Context Protocol server for AI tool integration
- **Rationale**: Enhance developer experience with AI-powered code generation, pattern consistency, and intelligent assistance
- **Status**: Approved
- **Date**: 2024-01-XX

### Technical Decisions

**TD-001: OpenAPI-First Development**
- **Decision**: All routes must use OpenAPI specifications
- **Rationale**: Type safety, documentation, contract-first development
- **Status**: Approved

**TD-002: Monorepo Structure**
- **Decision**: Transform single repo into monorepo with packages
- **Rationale**: Better organization, independent versioning, clear boundaries
- **Status**: Approved

**TD-003: Interactive Migration System**
- **Decision**: Build interactive migration system with safety features
- **Rationale**: Safe updates, user control, conflict resolution
- **Status**: Approved

## MCP Server Integration

### AI-First Developer Experience

**Purpose:**
- Provide Model Context Protocol (MCP) server for AI tool integration
- Enable intelligent code generation following G1 patterns
- Enhance developer productivity with context-aware AI assistance

**Key Benefits:**
- **Project Understanding**: AI tools can analyze G1 project structure and patterns
- **Intelligent Code Generation**: Generate domains, handlers, and services following G1 conventions
- **Plugin Discovery**: AI-powered plugin recommendations based on project needs
- **Migration Assistance**: Guide developers through framework upgrades and migrations
- **Pattern Consistency**: Ensure team-wide adherence to G1 best practices

### MCP Server Capabilities

**Core Tools:**
```typescript
// @g-1/mcp-server tools
{
  "analyze_project_structure": "Analyze G1 project structure and patterns",
  "suggest_plugins": "Recommend plugins based on project needs", 
  "generate_domain_code": "Generate domain handlers/services following G1 patterns",
  "validate_openapi_spec": "Validate OpenAPI specs against G1 conventions",
  "migration_guidance": "Provide step-by-step migration guidance",
  "optimize_performance": "Suggest performance optimizations",
  "security_audit": "Validate security best practices"
}
```

**Resources:**
```typescript
{
  "g1://project/structure": "Current project structure and configuration",
  "g1://plugins/available": "Available plugins and their capabilities", 
  "g1://templates/catalog": "Template catalog and usage patterns",
  "g1://patterns/domains": "Domain structure examples and conventions",
  "g1://migrations/history": "Migration history and available upgrades"
}
```

### Integration Points

**CLI Integration:**
```bash
# Start MCP server with development
npx @g-1/cli dev --with-mcp

# Standalone MCP server
npx @g-1/mcp-server start --port 3001

# Configure AI tools
npx @g-1/cli setup mcp --for cursor
npx @g-1/cli setup mcp --for vscode
```

**IDE Integration:**
- VS Code extension with automatic MCP discovery
- Cursor integration for G1-specific AI assistance
- Context-aware code completion and suggestions
- Intelligent refactoring based on G1 patterns

**Framework Integration:**
- Reads `g1.config.js` for project context
- Accesses plugin configurations and dependencies
- Understands domain structure and OpenAPI specs
- Provides migration paths and upgrade suggestions

### Use Cases

**For New Developers:**
- AI explains G1 patterns and conventions
- Guided project setup and configuration
- Context-aware examples and documentation
- Interactive learning through AI assistance

**For Experienced Developers:**
- Accelerated domain creation with pattern-aware generation
- Intelligent plugin suggestions and configurations
- Complex migration assistance and validation
- Performance optimization recommendations

**For Teams:**
- Consistent code patterns across team members
- AI-assisted code reviews with G1 best practices
- Automated documentation generation
- Knowledge sharing through intelligent suggestions

### Package Structure

```
packages/
├── mcp-server/              # @g-1/mcp-server
│   ├── src/
│   │   ├── tools/           # MCP tools implementation
│   │   │   ├── analyze.ts   # Project analysis
│   │   │   ├── generate.ts  # Code generation
│   │   │   ├── migrate.ts   # Migration assistance
│   │   │   └── validate.ts  # Validation tools
│   │   ├── resources/       # MCP resources
│   │   │   ├── project.ts   # Project structure
│   │   │   ├── plugins.ts   # Plugin catalog
│   │   │   └── patterns.ts  # G1 patterns
│   │   ├── server.ts        # MCP server setup
│   │   └── config.ts        # Server configuration
│   ├── templates/           # Code generation templates
│   └── package.json
```

## Next Steps

1. **Create PRD** - Define detailed requirements and success criteria
2. **Phase 1**: Foundation setup and monorepo creation
3. **Phase 2**: Plugin system and authentication templates
4. **Phase 3**: Migration system and update mechanisms
5. **Phase 4**: Documentation and examples

---

*This document is a living guide that should be updated as architectural decisions evolve.*