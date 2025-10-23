# G1 Studio API Framework

A high-performance, enterprise-grade TypeScript API framework monorepo built for modern cloud infrastructure.

## 🚀 Features

- **High Performance**: Built on Hono.js for blazing-fast API responses
- **Cloud Native**: Optimized for Cloudflare Workers and edge computing
- **Type Safe**: Full TypeScript support with strict type checking
- **Monorepo Structure**: Organized workspace for scalable development
- **Enterprise Ready**: Production-tested patterns and best practices

## 📦 Packages

- **[@g-1/core](./packages/core)**: Core API framework with routing, middleware, and utilities
- **[test-package](./test-package)**: Integration tests and examples

## 🛠️ Development

### Prerequisites

- Bun 1.0+ 
- Node.js 18+ (for compatibility)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/g1-studio/api-framework.git
cd api-framework

# Install dependencies
bun install

# Build all packages
bun run build

# Run development server
bun run dev

# Run tests
bun run test
```

### Workspace Commands

```bash
# Install dependencies for all packages
bun install

# Build all packages
bun run build

# Run tests across all packages
bun run test

# Lint all packages
bun run lint

# Type check all packages
bun run typecheck

# Clean all build artifacts
bun run clean
```

### Working with Individual Packages

```bash
# Run commands in specific workspace
bun run --filter=@g-1/core dev
bun run --filter=test-package test

# Add dependencies to specific package
bun add lodash --cwd packages/core
```

## 🔄 Release Management

This project uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

### Creating a Changeset

```bash
# Add a changeset for your changes
bun run changeset

# Follow the prompts to describe your changes
# This creates a markdown file in .changeset/
```

### Publishing Releases

Releases are automated via GitHub Actions when changes are merged to `main`:

1. **Development**: Create changesets for your changes
2. **Release PR**: Changesets bot creates a release PR with version bumps
3. **Publish**: Merging the release PR publishes packages to npm

## 🏗️ Architecture

```
api-framework/
├── packages/
│   └── core/           # Core API framework
├── test-package/       # Integration tests
├── .github/           # GitHub Actions workflows
├── .changeset/        # Version management
└── package.json       # Workspace configuration
```

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests for specific package
bun run --filter=@g-1/core test

# Run integration tests
bun run --filter=test-package test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Create a changeset: `bun run changeset`
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🔗 Links

- [Documentation](https://g1-studio.github.io/api-framework)
- [Issues](https://github.com/g1-studio/api-framework/issues)
- [Changelog](https://github.com/g1-studio/api-framework/releases)