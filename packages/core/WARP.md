# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the **G1 Core API** - a high-performance TypeScript API built for **Cloudflare Workers** using the Hono framework. This project provides a full-stack API foundation with authentication, database management, and modern development tooling.

**Key Technologies:**

- **Runtime**: Cloudflare Workers (Edge computing)
- **Framework**: Hono (Fast, lightweight web framework)
- **Database**: D1 (Cloudflare's SQL database) with Drizzle ORM
- **Authentication**: Better Auth with anonymous login, email/password, OTP
- **Package Manager**: Bun (prefer bun over npm/yarn)
- **API Documentation**: OpenAPI/Swagger with Scalar
- **Testing**: Vitest with Cloudflare Workers test environment

## Essential Commands

### Development

```bash
# Start local development server (runs on http://localhost:8787)
bun run dev

# Development server with higher rate limits (bypasses 429 errors)
bun run dev:unlimited

# Type checking without building
bun run typecheck

# Run tests
bun run test

# Run tests with CI configuration (silent, bail on first failure)
bun run test:ci

# Lint code
bun run lint

# Fix linting issues
bun run lint:fix
```

### Database Operations

```bash
# Generate database migrations from schema changes
bun run db:generate

# Apply migrations locally (development)
bun run db:migrate:local

# Apply migrations to production
bun run db:migrate:remote

# Open Drizzle Studio for database management
bun run db:studio
```

### Authentication Schema Management

```bash
# Generate auth schema from Better Auth configuration
bun run auth:generate

# Format auth schema file
bun run auth:format

# Update auth schema (generate + format)
bun run auth:update
```

### Deployment and Release Management

```bash
# Deploy to Cloudflare Workers
bun run deploy

# Generate TypeScript types for Cloudflare bindings
bun run cf-typegen

# Interactive release workflow (from main branch)
bun run release

# Feature branch workflow (automated PR and merge)
bun run feature

# Check workflow status
bun run workflow:status
```

### Development and Debugging

```bash
# Quick fix for rate limit 429 errors
bun run fix-rate-limit

# Interactive rate limit management
bun run rate-limit

# Project demo and showcase
bun run demo

# Test authentication endpoints
bun run test-auth-endpoints

# WARP workflow enhancement (automatic typecheck and fixes)
bun run warp:enhance
```

## Architecture Quick Reference

- **Entry Point**: `src/app.ts` - Main application setup with route mounting
- **Core Logic**: `src/lib/create-app.ts` - App factory with optimized middleware stack
- **Database**: `src/db/` - Drizzle ORM with D1, organized by domain tables
- **Routes**: `src/routes/v1/[feature]/` - Versioned, domain-based organization
- **Auth**: Better Auth with Cloudflare Workers adapter, session + KV storage
- **Testing**: `test/utils.ts` - Cookie-aware helpers for auth testing flows

**Critical Files**:

- `src/db/auth.schema.ts` - Generated auth tables (DO NOT EDIT manually)
- `src/db/tables/` - Custom business domain tables
- `test/setup.ts` & `test/apply-migrations.ts` - Test environment configuration

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Development Patterns

### Creating New API Routes

1. **Create route module** in `src/routes/v1/[feature]/`
2. **Follow the pattern**:
   - `[feature].index.ts` - Main export
   - `[feature].routes.ts` - OpenAPI route definitions
   - `[feature].handlers.ts` - Business logic
   - `[feature].repository.ts` - Database operations (optional)

3. **Register route** in `src/routes/v1/index.ts` and mount in `src/app.ts`

### Database Schema Changes

1. **Modify tables** in `src/db/tables/[domain].table.ts`
2. **Generate migration**: `bun run db:generate`
3. **Review generated SQL** in `src/db/migrations/`
4. **Apply locally**: `bun run db:migrate:local`
5. **Test changes** thoroughly
6. **Deploy**: `bun run db:migrate:remote`

### Testing Strategy

**Framework**: Vitest with `@cloudflare/vitest-pool-workers`
**Setup Files**:

- `test/apply-migrations.ts` - Database setup
- `test/setup.ts` - Test environment configuration

**Test Environment**: Isolated Cloudflare Workers environment with:

- Mock D1 database with automatic migrations via `TEST_MIGRATIONS`
- Mock KV storage (`MY_API_PROJECT_KV_AUTH`)
- Mock email service (`MOCK_EMAIL_SERVICE=true`)
- Test-specific environment variables and stubs

**Cookie Testing**: Use helpers from `test/utils.ts`:

- `requestWithCookies()` - Auto cookie persistence across requests
- `requestJSON()` - Cookie-aware JSON requests with status assertions
- `postJSON()` - Convenience wrapper for POST requests
- `resetCookies()` - Clear cookie jar between test scenarios

## Local Development Notes

- **Dev Server**: `bun run dev` → http://localhost:8787
- **API Documentation**: Available at `/doc` (Scalar UI)
- **Health Check**: Available at `/health`
- **Anonymous Login Demo**: Available at root `/`
- **Protected Route Demo**: `/protected` (requires authentication)
- **Legacy Dashboard**: `/dashboard` (authentication testing UI)
- **Database**: Local D1 instance via Wrangler (auto-configured)
- **Hot Reload**: Automatic via Wrangler dev
- **Rate Limiting**: Development-friendly limits (1000/15min API, 200/15min auth)

## Shared Packages

**Locations**:

- `@g-1/test`: `/Users/johnnymathis/Developer/g1/test` - Testing utilities, runners, fixtures
- `@g-1/workflow`: `/Users/johnnymathis/Developer/g1/workflow` - Release/feature workflows, automation
- `@g-1/util`: `/Users/johnnymathis/Developer/g1/util` - Generic helpers, types, logging

**Usage in this project**:

- Tests use custom test runner: `/Users/johnnymathis/Developer/g1/test/dist/cli/test-runner.js --runtime bun`
- Release management via `bunx @g-1/workflow release`
- Feature workflows via `bunx @g-1/workflow feature`

## Guidance for Warp

### Package Consolidation Strategy

- **Before adding utilities/runners/workflows**, check these repos for an existing implementation.
- **When duplication is detected**, propose an extraction plan and PR outline to move code to the right package.
- **For new cross-project functionality**, start in the appropriate shared package from the beginning.

### Consolidation Rules:

#### `@g-1/util` - Development Utilities & Business Logic

- Generic helpers, types, logging, configuration
- Development environment setup and validation utilities
- Package management and dependency linking tools
- TypeScript compilation and validation helpers
- Node.js development tools (`@g-1/util/node`)
- **Example**: WARP workflow enhancement belongs here

#### `@g-1/test` - Testing Infrastructure

- Testing/Vitest helpers, runners, fixtures, factories
- Cookie persistence utilities for auth testing
- Mock services and test environment setup
- Test data generation and management

#### `@g-1/workflow` - CI/CD & Release Automation

- Release automation and deployment pipelines
- Git workflow orchestration and management
- Version bumping and changelog generation
- GitHub release and PR automation

### Extraction Detection Rules for AI

**🚨 Red Flags Requiring Extraction:**

1. Code exists in 2+ G1 projects with similar functionality
2. Development environment setup/validation utilities
3. Cross-project development workflow automation
4. Generic helpers that solve common problems
5. CLI tools that would benefit multiple projects

**📋 Extraction Process:**

1. **Analyze scope**: Single project vs multi-project utility
2. **Choose target package** based on functionality type
3. **Create extraction plan** (see `EXTRACTION_PLAN_*.md` examples)
4. **Propose PR** with migration steps for human review
5. **Update all affected projects** to use shared implementation

**💡 Extraction Template:**

````markdown
# [Feature] Extraction Plan

## Target Package: @g-1/[util|test|workflow]

**Why this package**: [reasoning]

## Files to Extract:

- [source] → [destination]

## Migration Steps:

1. Add to shared package
2. Update consuming projects
3. Add CLI support (if applicable)
4. Update documentation

## API After Extraction:

```typescript
import { Feature } from '@g-1/[package]/[submodule]'
```
````

## Success Criteria:

- ✅ All G1 projects can use shared implementation
- ✅ No functionality loss
- ✅ Consistent API across projects

````

## Workflow Enhancement

**Automatic Integration**: WARP can automatically run workflow enhancements using the built-in scripts:

```bash
# Run full workflow enhancement (automatic typecheck, linking, fixes)
bun run warp:enhance

# Check project status for WARP decision making
bun scripts/warp-integration.ts status

# Quick typecheck only
bun scripts/warp-integration.ts typecheck
````

**Integration Points** - WARP should automatically call these at:

1. **Before code work**: `WarpIntegrationPoints.beforeCodeWork()` - Ensures clean environment
2. **After code changes**: `WarpIntegrationPoints.afterCodeWork()` - Validates changes
3. **On TypeScript errors**: `WarpIntegrationPoints.onTypescriptError()` - Attempts automatic fixes

**Automatic Fixes Applied**:

- Links missing @g-1 packages (test, workflow, util)
- Reinstalls dependencies if needed
- Regenerates auth schema types
- Regenerates Cloudflare types
- Provides actionable error guidance

**⚠️ EXTRACTION NEEDED**: The WARP workflow enhancement functionality currently lives in this project but should be extracted to `@g-1/util/node/warp` for use across all G1 projects. See `EXTRACTION_PLAN_WARP_ENHANCEMENT.md` for detailed migration steps.

## WARP-Specific Tips

- **Before making changes**: WARP automatically runs workflow enhancement, or manually use `bun run warp:enhance`
- **After making changes**: Always run `bun run test:ci` to verify functionality
- **Database changes**: Run `bun run db:generate` after schema modifications, review SQL before applying
- **Auth schema changes**: Use `bun run auth:update` (generates + formats auth.schema.ts)
- **Rate limit issues**: Run `bun run fix-rate-limit` to quickly resolve 429 errors
- **Testing auth flows**: Use cookie helpers from `test/utils.ts` instead of manual cookie management
- **Route registration**: New routes go in `src/routes/v1/[feature]/` with the standard 4-file pattern
- **Never edit** `src/db/auth.schema.ts` manually - it's generated by Better Auth

**Reference Documentation**:

- [TESTING.md](./TESTING.md) - Cookie testing helpers and patterns
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed system design and structure
- [scripts/README.md](./scripts/README.md) - Development scripts and workflow automation
