# API Framework Transformation Plan

## Overview

This document outlines the plan to transform the existing G1 Core API into a hybrid npm package framework that serves as both a runtime framework and a boilerplate generator for API projects.

## Framework vs Boilerplate: The Key Distinction

### 🏗️ **Framework Components** (`@g-1/core`)
- **Runtime dependencies** that APIs import and use
- **Shared utilities, middleware, patterns** that provide consistent behavior
- **Interfaces and abstractions** that define how things work
- **Update mechanism** - when we improve the framework, APIs get the benefits

```typescript
// This is framework code - APIs depend on it at runtime
import { createApp, requirePermission } from '@g-1/core'
import { EmailService } from '@g-1/core/services'

const app = createApp()
app.use('/admin/*', requirePermission('admin'))
```

### 📋 **Boilerplate Components** (`@g-1/templates`)
- **Code generation/scaffolding** that creates files in the API project
- **Templates that become part of the API codebase**
- **One-time generation** - after scaffolding, the API owns the code

```typescript
// This is boilerplate code - generated once, then owned by the API
// Generated from template, but lives in my-api/src/auth/config.ts
export const authConfig = {
  providers: ['email', 'google'],
  // ... API-specific configuration
}
```

## Architecture: Independent Repositories

```
g1-studio/                     # Workspace root (unchanged)
├── api-framework/             # Transform into API Framework monorepo
│   └── packages/              # Framework packages (CURRENT)
│       ├── core/             # @g-1/core (main framework)
│       ├── cli/              # @g-1/cli (scaffolding tool)
│       ├── example/          # @g-1/example (example application)
│       ├── templates/        # @g-1/templates (code templates)
│       ├── util/             # @g-1/util (utility functions)
│       └── starters/         # Complete starter projects (empty)
├── devtools/                 # Independent monorepo (UNCHANGED)
│   └── packages/
│       ├── util/             # @g-1/util (foundation utilities)
│       ├── workflow/         # @g-1/workflow (release automation)
│       └── test/             # @g-1/test (testing framework)
├── docs/                     # Independent docs site (UNCHANGED)
└── test-package/             # Independent test (UNCHANGED)
```

## Key Independence Principles

### 1. API Framework = API Development Only
- **Scope**: API development, authentication, database abstraction, routing, plugin system
- **Packages**: `@g-1/core`, `@g-1/cli`, `@g-1/templates`
- **Dependencies**: Can use `@g-1/util` and `@g-1/models` from devtools, but devtools doesn't depend on api-framework

### 2. Devtools = Development Utilities + Shared Models
- **Scope**: Build tools, testing utilities, workflow automation, shared TypeScript interfaces
- **Packages**: `@g-1/util`, `@g-1/test`, `@g-1/workflow`, `@g-1/shared`, `@g-1/models`
- **Independence**: Usable by any project, not just APIs

### 3. Docs = Documentation Site
- **Scope**: Framework documentation and guides
- **Independence**: Can document both api-framework and devtools separately

## Package Dependency Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   devtools/     │    │ api-framework/  │    │     docs/       │
│   (utilities +  │◄───│  (api framework)│    │ (documentation) │
│    models)      │    └─────────────────┘    └─────────────────┘
└─────────────────┘             │                       │
         ▲                      ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   user-api-1/   │    │  Published Docs │
         └──────────────┤ (uses all three)│    │   (websites)    │
                        └─────────────────┘    └─────────────────┘

Detailed Dependencies:
• api-framework/core → @g-1/models (for typing)
• devtools/test → @g-1/models (for mock data)
• user-api-1 → @g-1/core, @g-1/models (runtime + types)
• frontend-app → @g-1/models (shared interfaces)
```

## Database Abstraction Layer (DAL)

### Framework Components (`@g-1/core/database`)
```typescript
// Standardized Repository interfaces
interface IRepository<T> {
  findById(id: string): Promise<T | null>
  findMany(filter: FilterOptions<T>): Promise<PaginatedResult<T>>
  create(data: CreateInput<T>): Promise<T>
  update(id: string, data: UpdateInput<T>): Promise<T>
  delete(id: string): Promise<void>
}

// Database client abstraction
interface IDbClient {
  connect(): Promise<void>
  disconnect(): Promise<void>
  transaction<T>(fn: (tx: ITransaction) => Promise<T>): Promise<T>
  raw(query: string, params?: any[]): Promise<any>
}

// Built-in utilities
export { TransactionMiddleware, ConnectionPoolHelper, CursorPagination }
```

### Template Components (`@g-1/templates/database/`)
```
@g-1/templates/database/
├── prisma/                    # Prisma ORM setup
│   ├── schema.prisma.template
│   ├── client.ts.template
│   └── repositories/
├── drizzle/                   # Drizzle ORM setup
│   ├── config.ts.template
│   ├── schema.ts.template
│   └── repositories/
├── typeorm/                   # TypeORM setup
│   ├── config.ts.template
│   ├── entities/
│   └── repositories/
└── mongoose/                  # MongoDB with Mongoose
    ├── config.ts.template
    ├── schemas/
    └── repositories/
```

## Plugin System Architecture

### Core Plugin Interface (`@g-1/core/plugin`)
```typescript
interface IPlugin {
  name: string
  version: string
  
  // Lifecycle hooks
  onInit?(app: App): Promise<void>
  onRoutesRegistered?(app: App): Promise<void>
  onShutdown?(app: App): Promise<void>
  
  // Optional configuration
  config?: PluginConfig
  dependencies?: string[]
}

// Plugin registry
class PluginManager {
  register(plugin: IPlugin): void
  load(pluginName: string): Promise<void>
  unload(pluginName: string): Promise<void>
  getLoadedPlugins(): IPlugin[]
}
```

### CLI Plugin Management
```bash
# Install and initialize plugins
npx @g-1/cli add logging --provider=winston
npx @g-1/cli add caching --provider=redis
npx @g-1/cli add storage --provider=s3
npx @g-1/cli add telemetry --provider=datadog

# List available plugins
npx @g-1/cli plugins list

# Remove a plugin
npx @g-1/cli remove caching
```

### Available Plugin Templates (`@g-1/templates/plugins/`)
```
@g-1/templates/plugins/
├── logging/
│   ├── winston/
│   ├── pino/
│   └── console/
├── caching/
│   ├── redis/
│   ├── memcached/
│   └── in-memory/
├── storage/
│   ├── s3/
│   ├── gcs/
│   └── local/
├── telemetry/
│   ├── datadog/
│   ├── newrelic/
│   └── prometheus/
└── auth-providers/            # Auth as plugins too
    ├── better-auth/
    ├── clerk/
    └── auth0/
```

## Shared Models Package (`@g-1/models`)

### Purpose and Structure
The `@g-1/models` package provides shared TypeScript interfaces and types that can be used across the entire ecosystem - APIs, frontends, tests, and documentation.

```typescript
// @g-1/models/core
export interface IUser {
  id: string
  email: string
  username?: string
  createdAt: Date
  updatedAt: Date
}

export interface IPaginationResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface IApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    timestamp: string
    requestId: string
  }
}
```

### Usage Across Ecosystem
```typescript
// In API (api-framework/core)
import { IUser, IApiResponse } from '@g-1/models'

export function getUser(id: string): Promise<IApiResponse<IUser>> {
  // Implementation uses shared types
}

// In Frontend
import { IUser, IPaginationResponse } from '@g-1/models'

interface UserListProps {
  users: IPaginationResponse<IUser>
}

// In Tests (devtools/test)
import { IUser } from '@g-1/models'

export const mockUser: IUser = {
  id: '123',
  email: 'test@example.com',
  // ... matches interface exactly
}
```

## Authentication Template System Design

```
@g-1/templates/
├── auth/
│   ├── better-auth/           # Full Better-Auth setup
│   │   ├── config.ts.template
│   │   ├── middleware.ts.template
│   │   ├── routes.ts.template
│   │   └── package.additions.json
│   ├── custom-jwt/            # Custom JWT implementation
│   │   ├── config.ts.template
│   │   ├── middleware.ts.template
│   │   └── package.additions.json
│   ├── supabase-auth/         # Supabase integration
│   ├── clerk/                 # Clerk integration
│   ├── auth0/                 # Auth0 integration
│   └── none/                  # No authentication
│       ├── middleware.ts.template  # Pass-through middleware
│       └── types.ts.template       # Minimal user types
```

### CLI Authentication Selection

```bash
$ npx @g-1/cli create my-api

? Select authentication provider:
  ❯ Better Auth (Full-featured, self-hosted)
    Custom JWT (Lightweight, DIY)
    Supabase Auth (Hosted, integrated)
    Clerk (Hosted, enterprise)
    Auth0 (Enterprise SSO)
    None (No authentication)

? Better Auth plugins (multi-select):
  ❯ ✓ Email/Password
    ✓ Anonymous users
    ✓ Organizations
    ✓ Email OTP
    ✗ Social providers (Google, GitHub, etc.)
    ✗ Two-factor authentication
    ✗ Admin panel
```

## Current Better-Auth Integration Analysis

### Core Integration Points:
- `api-framework/src/auth/index.ts` - Main auth configuration
- `api-framework/src/middleware/auth.middleware.ts` - Auth middleware setup
- `api-framework/src/middleware/session-management.middleware.ts` - Session handling
- Database schema generation via `auth:generate` script
- Route protection via `requirePermission` function

### Framework vs Template Classification:

**Framework Parts:**
- Auth interfaces and middleware patterns
- Permission systems and role management
- Session handling utilities

**Boilerplate Parts:**
- Specific auth provider configuration (Better-Auth, Clerk, etc.)
- Database schema for auth tables
- Route definitions for auth endpoints

## Implementation Phases

### Phase 1: Foundation Setup (Start Here!)

#### Step 1: Restructure Directory
```bash
api-framework/
└── packages/                  # CURRENT: Framework packages
    ├── core/                 # @g-1/core (main framework)
    ├── cli/                  # @g-1/cli (scaffolding tool)
    ├── example/              # @g-1/example (example application)
    ├── templates/            # @g-1/templates (code templates)
    ├── util/                 # @g-1/util (utility functions)
    └── starters/             # Complete starter projects (empty)
```

#### Step 2: Extract Framework Components
- Move reusable utilities from `src/lib/` → `packages/core/`
- **NEW: Establish Database Abstraction Layer** in `packages/core/database/`
- Move auth configs from `src/auth/` → `packages/templates/auth/`
- Move database implementations → `packages/templates/database/`
- Keep current `src/` as working example

#### Step 3: Create CLI and Plugin System
- Build `packages/cli/` that can generate new APIs
- Implement plugin management system in `packages/core/plugin/`
- Use templates from `packages/templates/`
- Test by generating `examples/simple-api/`

### Phase 2: Template System and CLI Scaffolding Tool

### Phase 3: Migration and Update Mechanisms

#### Migration Template System
The CLI will use a specific set of diff templates stored in `packages/templates/migrations/` to compare the user's current version against the new one.

```
@g-1/templates/migrations/
├── auth/
│   ├── better-auth-1.3-to-2.0/
│   │   ├── diff.template
│   │   ├── instructions.md
│   │   └── manual-steps.json
│   └── clerk-1.0-to-2.0/
├── database/
│   ├── prisma-4-to-5/
│   └── drizzle-0.28-to-0.29/
└── plugins/
    ├── logging-winston-2-to-3/
    └── caching-redis-6-to-7/
```

#### Interactive Migration Process
```bash
# Migration command with user interaction
npx @g-1/cli migrate auth --from=better-auth@1.3 --to=better-auth@2.0

# Process:
# 1. Analyze current user files
# 2. Show diff preview
# 3. Ask for user confirmation on each change
# 4. Handle conflicts interactively (like Git merge)
# 5. Generate backup before applying changes
```

#### Maintenance Mode Feature (`@g-1/core/maintenance`)
```typescript
// Built into @g-1/core for live service transitions
import { MaintenanceMode } from '@g-1/core/maintenance'

const app = createApp({
  maintenance: {
    enabled: process.env.MAINTENANCE_MODE === 'true',
    message: 'API is temporarily unavailable for maintenance',
    allowedPaths: ['/health', '/status'],
    readOnlyMode: true  // Allow GET requests only
  }
})
```

#### Migration Safety Features
- **Backup Creation**: Automatic backup of user files before migration
- **Rollback Support**: `npx @g-1/cli rollback --to-backup=<timestamp>`
- **Dry Run Mode**: `npx @g-1/cli migrate --dry-run` to preview changes
- **Manual Review Required**: All boilerplate migrations require user confirmation
- **Conflict Resolution**: Interactive merge conflict resolution similar to Git

### Phase 4: Comprehensive Documentation and Examples

## Cross-Repository Usage Examples

### APIs can use both independently:
```json
// user-api/package.json
{
  "dependencies": {
    "@g-1/core": "^1.0.0",               // From api-framework/
    "@g-1/util": "^1.0.0"                // From devtools/
  }
}
```

### Devtools remains independent:
```json
// some-frontend-project/package.json  
{
  "dependencies": {
    "@g-1/util": "^1.0.0",            // Just utilities, no API stuff
    "@g-1/workflow": "^1.0.0"         // Just workflow, no API stuff
  }
}
```

## Real-World Usage Scenarios

```bash
# Startup with simple auth
npx @g-1/cli create startup-api --auth=custom-jwt

# Enterprise with SSO
npx @g-1/cli create enterprise-api --auth=auth0

# Public API with optional auth
npx @g-1/cli create public-api --auth=none

# Full-featured SaaS
npx @g-1/cli create saas-api --auth=better-auth --plugins=all
```

## The Update Story

```bash
# Framework updates (automatic benefits)
npm update @g-1/core  # Gets new middleware, security fixes

# Boilerplate updates (opt-in migrations)
npx @g-1/cli migrate auth --from=better-auth@1.3 --to=better-auth@2.0
```

## Benefits of This Approach

1. **Independence Preserved**: Each repo has its own purpose and release cycle
2. **Selective Usage**: Projects can use devtools without API framework
3. **Clear Boundaries**: API concerns stay in api-framework, utilities stay in devtools
4. **Existing Structure**: Minimal disruption to current setup
5. **Future Flexibility**: Easy to split further if needed
6. **Flexibility**: APIs can have completely different auth without framework lock-in
7. **Maintainability**: Auth updates don't break existing APIs
8. **Onboarding**: Developers choose what they know/need
9. **Migration**: Easy to switch auth providers later
10. **Bundle Size**: Only include what you use

## Immediate Next Steps

1. **Rename `core/` to `api-framework/`**
2. **Creating the `packages/` directory structure inside `api-framework/`**
3. **Extracting the first component** (like `createApp`) to `packages/core/`
4. **Setting up workspace configuration** in `api-framework/package.json`
5. **Keeping the current `src/` as a working example**

## What We're Building

A **Modern API Framework** that:
1. **Provides runtime utilities** (framework)
2. **Generates customizable starting code** (boilerplate)
3. **Enables incremental adoption** (hybrid)
4. **Supports diverse use cases** (templates)

This is similar to how **Next.js** works:
- **Framework**: React utilities, routing, optimization
- **Boilerplate**: `create-next-app` generates starter code
- **Hybrid**: You depend on Next.js but own your generated code

---

*This document serves as the master plan for transforming the G1 Core API into a comprehensive, flexible API framework while maintaining the independence and modularity of the existing ecosystem.*
