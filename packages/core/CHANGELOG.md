# Changelog

## 1.15.13

### Patch Changes

- # Code Quality Improvements

  This release focuses on comprehensive code quality improvements across the framework:

  ## 🔧 Type Safety Enhancements

  - **Fixed all explicit `any` types** - Replaced with proper type definitions throughout the codebase
  - **Improved session and user typing** - Added proper interfaces for authentication bindings
  - **Enhanced OpenAPI hook types** - Replaced `any` with `unknown` for better type safety
  - **Environment parsing improvements** - Updated to use `Record<string, unknown>` instead of `any`

  ## 🛠️ Code Style & Best Practices

  - **Removed useless constructors** - Eliminated redundant constructors that only called `super()`
  - **Added missing radix parameters** - Fixed all `parseInt()` calls to include explicit radix (base 10)
  - **Cleaned up imports** - Removed unused imports and dependencies
  - **Fixed non-null assertions** - Replaced with proper null checks and error handling

  ## 📦 Affected Packages

  - **@g-1/core**: Security middleware, base repository, types, and OpenAPI utilities
  - **@g-1/templates**: Email template constructors and imports
  - **@g-1/boilerplate**: Environment parsing functions

  ## 🎯 Impact

  - **Zero lint warnings** - Achieved perfect code quality standards
  - **Improved maintainability** - Better type safety and cleaner code structure
  - **Enhanced developer experience** - More predictable types and better error handling
  - **Future-proof codebase** - Follows modern TypeScript best practices

  All changes are backward compatible and maintain existing functionality while significantly improving code quality.

## 1.15.12

### Patch Changes

- Improve testing infrastructure and code quality

  - Add test dashboard and runner for better test visualization
  - Fix linting issues and improve code consistency
  - Update dependencies and configurations

- Updated dependencies
  - @g-1/util@1.0.1

## [1.16.0] - 2025-10-22

### Features

- Repository restructure: Separated core framework into independent repository
- Removed monorepo structure for better modularity and deployment
- Updated Git configuration for standalone core repository

### Other Changes

- chore: Initial commit for standalone G1 Studio Core Framework

## [1.15.8] - 2025-10-22

### Other Changes

- chore: commit changes before release

## [1.15.7] - 2025-10-19

## [1.15.6] - 2025-10-19

## [1.15.5] - 2025-10-19

### Other Changes

- chore: commit changes before release

## [1.15.4] - 2025-10-19

## [1.15.3] - 2025-10-19

## [1.15.2] - 2025-10-19

### Other Changes

- docs: add WARP enhancement extraction plan and integration script

## [1.15.1] - 2025-10-19

### Other Changes

- chore: commit changes before release

## [1.15.0] - 2025-10-19

### Features

- add comprehensive WARP workflow enhancement documentation
- Replace local crypto utils with @g-1/util Workers-safe implementation

### Other Changes

- chore: commit changes before release
- chore: commit changes before release

## [1.14.2] - 2025-10-19

### Other Changes

- chore: commit changes before release

## [1.14.1] - 2025-10-18

## [1.14.0] - 2025-10-18

### Features

- add test:ci script for automated testing

### Other Changes

- chore: commit changes before release
- chore: update test configuration and remove obsolete test-runner script

## [1.13.0] - 2025-10-18

### Features

- update to consolidated shared package dependencies

## [1.12.11] - 2025-10-18

### Other Changes

- chore: commit changes before release

## [1.12.10] - 2025-10-18

### Other Changes

- chore: commit changes before release

## [1.12.9] - 2025-10-18

## [1.12.8] - 2025-10-18

## [1.12.7] - 2025-10-18

## [1.12.6] - 2025-10-18

### Other Changes

- chore: commit changes before release
- chore: commit changes before release
- chore: commit changes before release

## [Unreleased]

## [1.12.5] - 2025-10-18

## Unreleased

### Added

- **API Versioning**: Complete implementation of API versioning with v1 route structure
  - Moved all API routes to versioned `/v1/` path structure
  - Reorganized early-access-requests routes under v1 namespace
  - Added versioned auth documentation routes
  - Enhanced route organization for better API evolution support

### Changed

- **Route Structure**: Migrated existing routes to versioned API structure
  - Early access requests now available at `/v1/early-access-requests/*`
  - Auth documentation moved to `/v1/auth-docs`
  - Index route reorganized under v1 structure
- **Test Updates**: Updated test files to work with new versioned API structure

### Developer Experience

- Improved API organization with clear versioning strategy
- Enhanced maintainability with structured route hierarchy
- Better support for future API evolution and backward compatibility

## [1.12.1] - 2025-10-17

### Fixed

- Fix TypeScript compilation errors in HTTP status handling
- Replace `HTTP_STATUS_PHRASES[statusCode]` with `getStatusPhrase(statusCode)` for proper numeric status code handling
- Add type assertions for HTTPException status codes in exception utilities
- Fix paginate function call signature in repository pagination methods
- Resolve unused variable warnings in early access requests repository

### Developer Experience

- All TypeScript strict checks now passing
- Improved type safety in HTTP status and pagination utilities
- Better error handling with proper status code types

## [1.12.0] - 2025-10-17

### Added

- Add new architecture documentation (ARCHITECTURE.md, GO-CORP.md)
- Add boilerplate setup configuration (boilerplate.config.js)
- Add setup script for boilerplate initialization
- Enhanced feature release script functionality
- Replace local utilities with @go-corp/utils v1.4.0

### Changed

- Updated README with latest project information
- Improved WARP.md documentation for development
- Enhanced authentication configuration and error handling
- Updated environment configuration with better validation
- Improved email template rendering system
- Enhanced security middleware with better CSP policies
- Updated Vitest configuration for better testing
- Improved worker configuration types
- Updated Wrangler configuration for better deployment
- Enhanced code organization and architecture

### Developer Experience

- Enhanced project setup and onboarding process
- Improved documentation and development guides
- Better configuration management and validation
- Added comprehensive documentation and examples
- Enhanced type safety and error handling

### Performance

- Optimized components and reduced redundancy

### Testing

- All tests passing with new architecture
- Improved test coverage and isolation

## [1.11.0] - 2025-10-17

### Added

- **Refactor/high Priority Optimizations**: Complete refactor/optimization for better maintainability and performance
- feat: refactor/high priority optimizations
- refactor: implement high-priority optimizations and industry-standard homepage

### Changed

- Enhanced developer experience and maintainability
- Improved code organization and architecture

### Performance

- Optimized components and reduced redundancy

### Developer Experience

- Added comprehensive documentation and examples
- Enhanced type safety and error handling

### Testing

- All tests passing with new architecture
- Improved test coverage and isolation

## [1.10.2] - 2025-10-17

### Fixed

- Add missing newlines at end of file (EOF) in test files to resolve ESLint errors.

### Performance

- Refactor app bootstrap in `src/lib/create-app.ts` to reduce per-request allocations (reused validation/CORS options, hoisted static HTML).
- Extract dashboard HTML to `src/lib/static/dashboard.ts` and serve constant string.
- Extract test helper routes to `src/lib/register-test-routes.ts`; always registered under `/__test__/*` and kept behind that prefix.
- Scope auth/session middleware to only `/api/*` and `/protected`.
- Gate API docs by env (`API_DOCS_ENABLED`) in `src/app.ts`.

### Database

- Add indexes: `sessions(userId)`, `verifications(identifier, expiresAt)`, `accounts(providerId,accountId,userId)`, `members(organizationId,userId)`.
- Optimize existence check in early-access repository to `select 1 limit 1`.

### Mail/Auth

- Lazy-load mail templates in auth flows to reduce cold-start time.

### Tooling

- Ignore `coverage/` in `.gitignore`.
- Lint and import-order fixes; typecheck clean.

## [1.10.1] - 2025-10-17

### Added

- Cookie-aware test helper (requestWithCookies, requestJSON/postJSON) to persist session cookies in tests.
- New tests: sign-out flow, protected route, email outbox, permissions (system and org), time-control with fake timers.
- Permissions middleware tests with org membership setup.
- TESTING.md with guidance and examples.

### Changed

- Removed test-only fallbacks from runtime; rely on session middleware and test helpers.
- Disabled pino logger during tests; Better Auth debugLogs only in development.
- Refactored all applicable tests to use cookie helpers.

### Fixed

- EarlyAccessRequestsRepository.findOneByEmail now returns null when not found (instead of undefined).
- Stabilized protected-route test by forwarding cookies.

### Documentation

- Enhanced top-level README with badges, quickstart, architecture diagram, and testing notes.
- Linked docs from scripts/README.md.

### CI

- Increased coverage thresholds (statements 36, branches 20, functions 28, lines 36).

## 1.0.10

### Patch Changes

- Update source code and functionality
- Update dependencies and package configuration
- Update TypeScript configuration
- Update documentation
- Improve testing coverage
- Update configuration files

## 1.0.9

### Patch Changes

- Update source code and functionality
- Update dependencies and package configuration
- Update TypeScript configuration
- Update documentation
- Improve testing coverage
- Update configuration files

## 1.0.8

### Patch Changes

- Update source code and functionality
- Update dependencies and package configuration

## 1.0.7

### Patch Changes

- General maintenance and updates

## 1.0.6

### Patch Changes

- Update source code and functionality
- Update dependencies and package configuration

## [1.0.5] - 2025-10-15

### Added

- implement base repository and service pattern optimizations
- complete case-insensitive email normalization implementation
- update CORS origins for production domains
- add early-access-requests API endpoint and related functionality
- add permissions system and enhanced auth schema

### Changed

- 🔄 Add improved release script from v1.4.0
- ✨ Add @go-corp/utils package and workflow scripts
- v1
- added session management
- added email change request and password reset
- added v2
- refactored for V1 and V2
- initial commit

### Fixed

- resolve linting issues in CSP policy formatting
- extend permissive CSP to HTML dashboard endpoints
- resolve linting issues in security middleware CSP policy
- resolve TypeScript module error in db/tables

## [1.0.4] - 2025-10-15

### Added

- implement base repository and service pattern optimizations
- complete case-insensitive email normalization implementation
- update CORS origins for production domains
- add early-access-requests API endpoint and related functionality
- add permissions system and enhanced auth schema

### Changed

- 🔄 Add improved release script from v1.4.0
- ✨ Add @go-corp/utils package and workflow scripts
- v1
- added session management
- added email change request and password reset
- added v2
- refactored for V1 and V2
- initial commit

### Fixed

- resolve linting issues in CSP policy formatting
- extend permissive CSP to HTML dashboard endpoints
- resolve linting issues in security middleware CSP policy
- resolve TypeScript module error in db/tables

## [1.0.3] - 2025-10-15

### Added

- implement base repository and service pattern optimizations
- complete case-insensitive email normalization implementation
- update CORS origins for production domains
- add early-access-requests API endpoint and related functionality
- add permissions system and enhanced auth schema

### Changed

- 🔄 Add improved release script from v1.4.0
- ✨ Add @go-corp/utils package and workflow scripts
- v1
- added session management
- added email change request and password reset
- added v2
- refactored for V1 and V2
- initial commit

### Fixed

- resolve linting issues in CSP policy formatting
- extend permissive CSP to HTML dashboard endpoints
- resolve linting issues in security middleware CSP policy
- resolve TypeScript module error in db/tables

## 1.0.0

### major

- Complete project restructure with src/ directory organization
- Implement base repository and service pattern optimizations
- Add comprehensive authentication system with Better Auth
- Implement early-access-requests API endpoint
- Add permissions system and enhanced auth schema
- Configure CORS origins for production domains
- Implement case-insensitive email normalization
- Add comprehensive security middleware with CSP policies
- Full Cloudflare Workers integration with D1 database
- OpenAPI/Swagger documentation with Scalar UI
- Vitest testing setup with Cloudflare Workers pool
- TypeScript configuration with strict type checking
- ESLint configuration with Antfu presets
- Drizzle ORM with automated migrations
- Rate limiting and request validation middleware
- Comprehensive email templates for authentication flows
