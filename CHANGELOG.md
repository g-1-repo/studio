# Changelog

All notable changes to the G1 API Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2024-12-19

### Fixed
- Fixed incorrect import of `Scalar` from `@scalar/hono-api-reference` - now correctly imports `apiReference`
- Updated @g-1/core package to version 1.15.11 with the import fix
- Updated CLI templates to use @g-1/core@^1.15.11
- Resolved build errors in generated API projects
- Fixed dependency resolution issues with @scalar/hono-api-reference package

### Technical Improvements
- Verified API project generation, build, and runtime functionality
- Ensured proper npm package publishing and registry propagation
- Updated CLI project templates with correct dependency versions

## [1.1.0] - 2024-12-19

### Added
- Complete CLI package with comprehensive test coverage
- Version command with CLI and project information display
- G1 dependencies detection and filtering
- Create command for project scaffolding
- Generate command for code generation
- Info command for project information
- Comprehensive utility modules (validation, git, logger, template, file-system, package-manager)

### Fixed
- Version command test suite - resolved all 12 test cases
- Test isolation issues with proper mock setup and module resets
- CLI version consistency across all test cases
- G1 dependencies display functionality
- File read error handling in version command

### Technical Improvements
- Achieved 100% test coverage (219/219 tests passing)
- Implemented proper Vitest mocking strategies
- Added `vi.resetModules()` for better test isolation
- Standardized mock implementations across test suites
- Enhanced error handling in file system utilities

### Infrastructure
- Set up monorepo structure with packages for CLI, Core, Templates, and Utilities
- Configured TypeScript build system
- Established testing framework with Vitest
- Added comprehensive linting and code quality checks

## [0.1.0] - 2024-12-18

### Added
- Initial project structure and monorepo setup
- Basic CLI framework foundation
- Core package structure
- Development tooling and configuration