# Scripts

This directory contains utility scripts for development workflow management and project automation.

## 🚀 Workflow Automation

This project uses the **`@g-1/workflow`** package for comprehensive release and feature management.

### Release Management

```bash
# Interactive release workflow
bun run release

# Get help for release options
bun run release:help
```

### Feature Development Workflow

```bash
# Complete feature branch workflow (run from feature branch)
bun run feature-release

# Get help for feature release options
bun run feature-release:help
```

### Workflow Status and Configuration

```bash
# Check project and workflow status
bun run workflow:status

# Initialize or reconfigure workflow
bun run workflow:init

# Deploy using workflow
bun run deploy:workflow
```

## Utility Scripts

### `demo.ts`

Project demo and showcase script.

```bash
bun run demo
```

Demonstrates:

- API boilerplate capabilities
- Authentication flows
- Database operations
- Available endpoints

### Release and Feature Workflows

> **Note**: Release and feature workflows are now managed by the `@g-1/workflow` package.
> See the **Workflow Automation** section above for usage.

The workflow package provides:

**Release Management:**

- Automatic git analysis and version bump recommendations
- Interactive version selection (patch/minor/major)
- Pre-release quality checks (linting, tests, typecheck)
- Automatic changelog generation
- Git tagging and GitHub releases
- Optional deployment integration

**Feature Branch Workflow:**

- Automated feature branch to main workflow
- Commit management and PR creation
- Auto-merge capabilities with CI integration
- Professional GitHub releases
- Branch cleanup and maintenance
- Comprehensive change documentation

### `rate-limit-manager.ts`

Interactive rate limit management for development.

```bash
bun run rate-limit     # Interactive rate limit manager
```

Features:

- Check current rate limit settings
- Switch between development/production modes
- Environment configuration management
- Troubleshooting guidance for 429 errors

### `fix-rate-limit.sh`

Quick fix for "429 Too Many Requests" errors during development.

```bash
bun run fix-rate-limit  # Quick rate limit fix
./scripts/fix-rate-limit.sh  # Direct execution
```

Features:

- Automatically sets development environment
- Creates/updates .env file
- Immediate relief from rate limiting
- No restart required

### `warp-workflow-enhancer.ts`

Comprehensive workflow enhancement for WARP development environment.

```bash
bun run warp:enhance         # Full workflow enhancement
bun run warp:status          # Check project status
bun run warp:typecheck       # Quick TypeScript check
```

Features:

- Automatic G1 package linking (@g-1/test, @g-1/workflow, @g-1/util)
- TypeScript error detection and automatic fixes
- Dependency management and reinstallation
- Auth schema and Cloudflare types regeneration
- Comprehensive error reporting and guidance
- Integration points for WARP automation

### `warp-integration.ts`

WARP integration utilities for automatic workflow enhancement.

```bash
bun scripts/warp-integration.ts enhance    # Manual enhancement
bun scripts/warp-integration.ts status     # Project analysis
bun scripts/warp-integration.ts typecheck  # Quick typecheck
```

Integration Points:

- `beforeCodeWork()` - Run before code generation
- `afterCodeWork()` - Validate after code changes
- `onTypescriptError()` - Auto-fix TypeScript issues

### Quick Commands

```bash
# 🚀 Workflow Commands
bun run release              # Interactive release from main branch
bun run feature-release      # Feature branch workflow
bun run workflow:status      # Check project status
bun run workflow:init        # Initialize/reconfigure workflow
bun run deploy:workflow      # Deploy using workflow

# 🛠️ Development Commands
bun run demo                 # Show project demo
bun run fix-rate-limit       # Fix rate limit issues (429 errors)
bun run rate-limit           # Manage rate limits interactively
bun run dev:unlimited        # Run dev server with higher limits
bun run warp:enhance         # WARP workflow enhancement
bun run warp:status          # Check WARP project status
bun run warp:typecheck       # Quick TypeScript validation
```

## Dependencies

- **`@g-1/workflow`**: Comprehensive workflow automation package
- **`@g-1/util`**: Development utilities and helpers

## See Also

- Testing helpers and cookie persistence: [TESTING.md](../TESTING.md)
- Database structure and patterns: [src/db/README.md](../src/db/README.md)
