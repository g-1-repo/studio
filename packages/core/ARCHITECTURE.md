# Architecture & File Structure

## Directory Structure

```
├── src/
│   ├── app.ts                    # Main application entry point
│   ├── env.ts                    # Environment validation (Zod schemas)
│   ├── env-runtime.ts            # Runtime environment parsing
│   │
│   ├── auth/                     # Authentication configuration
│   │   └── index.ts              # Better Auth setup
│   │
│   ├── db/                       # Database layer
│   │   ├── index.ts              # Database connection factory
│   │   ├── schema.ts             # Combined schema exports
│   │   ├── auth.schema.ts        # Generated auth tables (DO NOT EDIT)
│   │   └── tables/               # Custom business tables
│   │       ├── index.ts          # Table exports
│   │       └── *.table.ts        # Domain-specific tables
│   │
│   ├── lib/                      # Core utilities and services
│   │   ├── create-app.ts         # App factory with middleware
│   │   ├── configure-open-api.ts # OpenAPI documentation setup
│   │   ├── base-repository.ts    # Repository pattern base class
│   │   ├── base-service.ts       # Service pattern base class
│   │   ├── types.ts              # Global TypeScript types
│   │   ├── constants.ts          # Application constants
│   │   ├── permissions.ts        # RBAC permissions
│   │   │
│   │   ├── errors/               # Error handling
│   │   │   └── index.ts          # Custom error classes
│   │   │
│   │   ├── static/               # Static content
│   │   │   └── dashboard.ts      # HTML templates
│   │   │
│   │   ├── templates/            # Template system
│   │   │   └── renderer.ts       # Template rendering engine
│   │   │
│   │   └── utils/                # Utility functions
│   │       ├── crypto.ts         # Cryptographic utilities
│   │       ├── drizzle.ts        # Database utilities
│   │       ├── exceptions.ts     # Exception handling
│   │       ├── http-status.ts    # HTTP status helpers
│   │       └── types.ts          # Type utilities
│   │
│   ├── middleware/               # HTTP middleware
│   │   ├── index.ts              # Middleware exports
│   │   ├── auth.middleware.ts    # Authentication middleware
│   │   ├── session-management.middleware.ts # Session handling
│   │   ├── security.middleware.ts # Security headers, validation
│   │   ├── pino-logger.ts        # Request logging
│   │   ├── favicon.ts            # Favicon middleware
│   │   ├── not-found.ts          # 404 handler
│   │   └── on-error.ts           # Global error handler
│   │
│   ├── routes/                   # API route modules
│   │   └── v1/                   # Versioned API routes (v1)
│   │       ├── index.ts          # v1 route aggregator
│   │       ├── index.route.ts    # Root v1 endpoints
│   │       ├── auth-docs.route.ts # Auth documentation
│   │       │
│   │       └── [feature]/        # Feature-based routing
│   │           ├── [feature].index.ts     # Route module entry
│   │           ├── [feature].routes.ts    # OpenAPI route definitions
│   │           ├── [feature].handlers.ts  # Route handlers
│   │           └── [feature].repository.ts # Data access (optional)
│   │
│   └── shared/                   # Shared utilities
│       ├── validation.ts         # Common validation schemas
│       └── db-utils.ts           # Database helper functions
│
├── scripts/                      # Development and deployment scripts
├── test/                         # Test utilities and setup
├── coverage/                     # Test coverage reports
└── src/db/migrations/           # Database migrations
```

## Design Principles

### 1. **Feature-Based Organization**

Routes are organized by business domain under versioned API structure:

```
routes/v1/users/users.index.ts
routes/v1/orders/orders.index.ts
routes/v1/analytics/analytics.index.ts
```

### 2. **Consistent Module Pattern**

Each feature follows the same structure:

- `.index.ts` - Main export and route registration
- `.routes.ts` - OpenAPI route definitions with Zod schemas
- `.handlers.ts` - Business logic and request handling
- `.repository.ts` - Data access layer (optional)

### 3. **Clear Separation of Concerns**

- **Routes**: HTTP concerns, validation, serialization
- **Handlers**: Business logic, orchestration
- **Repositories**: Data access, queries
- **Services**: Complex business operations
- **Middleware**: Cross-cutting concerns

### 4. **TypeScript-First**

- Strict typing throughout
- Zod schemas for runtime validation
- Generated types from database schema
- OpenAPI types from route definitions

### 5. **Performance-Optimized Middleware Stack**

Middleware ordered by frequency and performance impact:

1. Fast static content (favicon, health)
2. Environment parsing
3. Context and request tracking
4. Security headers
5. Request validation
6. CORS
7. Rate limiting
8. Logging
9. Authentication
10. Session management
11. Error handling

## Adding New Features

### 1. Create Route Module

```bash
mkdir src/routes/v1/my-feature
touch src/routes/v1/my-feature/my-feature.{index,routes,handlers}.ts
```

### 2. Follow the Pattern

```typescript
// my-feature.index.ts
export { default } from './my-feature.routes'
```

```typescript
// my-feature.routes.ts
import { createRoute } from '@hono/zod-openapi'
import { createRouter } from '@/lib/create-app'
import * as handlers from './my-feature.handlers'

const router = createRouter()
router.openapi(createRoute({
  // Route configuration here
}), handlers.list)
export default router
```

```typescript
// my-feature.handlers.ts
export async function list(c) {
  // Implementation here
}
```

### 3. Register in App

```typescript
// src/routes/v1/index.ts
import myFeature from './my-feature/my-feature.index'

// Or in src/app.ts
import v1Routes from './routes/v1'

// Add to v1 routes aggregator
export { myFeature }
app.route('/v1', v1Routes)
```

## Database Patterns

### Tables

- Organized by business domain in `src/db/tables/`
- Multi-tenant ready with `organizationId` foreign keys
- Use `createId()` for primary keys
- Include `createdAt`/`updatedAt` timestamps

### Repositories

- Extend `BaseRepository` for common CRUD operations
- Implement domain-specific query methods
- Handle organization scoping automatically
- Use transactions for complex operations

### Migrations

- Generated via `bun run db:generate`
- Reviewed before applying
- Environment-specific deployment
- Rollback strategies documented

This architecture supports rapid development while maintaining enterprise-grade structure and scalability.
