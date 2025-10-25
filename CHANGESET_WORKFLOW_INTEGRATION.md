# Changeset + @g-1/workflow Integration

This document explains how **Changesets** and **@g-1/workflow** work together to provide a comprehensive release management system for the `api-framework` project.

## Overview

The `api-framework` uses a **dual-system approach** for release management:

- **Changesets**: Version planning and change documentation
- **@g-1/workflow**: Release execution and automation

## How They Work Together

### 1. Development Phase (Changesets)

During development, use **Changesets** to document your changes:

```bash
# Add a changeset for your changes
bun run changeset

# Follow the prompts to:
# - Select which packages are affected
# - Choose version bump type (patch/minor/major)
# - Write a description of the changes
```

This creates a markdown file in `.changeset/` that describes:
- What changed
- Which packages are affected
- What type of version bump is needed

### 2. Release Phase (@g-1/workflow)

When ready to release, use **@g-1/workflow** to execute the release:

```bash
# Execute the release workflow
bun run workflow:release

# Or with specific options
bun run workflow:release --type patch --skip-tests
```

The workflow will:
- Run quality gates (lint, typecheck, tests)
- Calculate version bumps
- Update package.json versions
- Generate changelog
- Create git tags
- Push to remote
- Create GitHub releases
- Trigger npm publishing via GitHub Actions

## Benefits of This Integration

### Changesets Provides:
- **Structured change documentation**: Developers write meaningful descriptions
- **Version coordination**: Manages interdependent package versions in monorepo
- **Change tracking**: Clear history of what changed and why
- **Team collaboration**: Multiple developers can add changesets for the same release

### @g-1/workflow Provides:
- **Automated execution**: Consistent release process across all environments
- **Quality gates**: Ensures code quality before release
- **GitHub integration**: Automated releases and npm publishing
- **Error recovery**: Handles common release issues automatically
- **Configuration-driven**: Customizable via `.workflow.config.js`

## Workflow Commands

### Development Commands
```bash
bun run changeset              # Add a changeset
bun run version-packages       # Preview version changes (optional)
```

### Release Commands
```bash
bun run workflow:release       # Full release workflow
bun run release               # Alias for workflow:release
```

### Workflow Management
```bash
bunx @g-1/workflow status     # Show workflow status
bunx @g-1/workflow --help     # Show all available commands
```

## Configuration

### Changeset Configuration (`.changeset/config.json`)
```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch"
}
```

### Workflow Configuration (`.workflow.config.js`)
```javascript
export default {
  deployments: [{
    target: 'cloudflare-workers',
    command: 'bun run deploy',
    preCommand: 'bun run typecheck'
  }],
  github: {
    autoRelease: true,
    autoMerge: true,
    labels: ['enhancement', 'automated']
  },
  commands: {
    preRelease: ['bun run typecheck', 'bun run lint', 'bun run test:ci'],
    postRelease: ['echo "✅ Release complete!"']
  }
}
```

## Best Practices

### 1. Always Add Changesets
- Add a changeset for every meaningful change
- Write clear, descriptive change descriptions
- Choose appropriate version bump types

### 2. Use Workflow for Releases
- Always use `bun run workflow:release` for consistency
- Let the workflow handle version calculations and git operations
- Use `--dry-run` to preview changes before executing

### 3. CI/CD Integration
- GitHub Actions uses the same `@g-1/workflow` commands
- Ensures consistency between local and automated releases
- Changesets provide the change documentation for release notes

## Migration Notes

### Before (Changeset Only)
```bash
bun run changeset
bun run version-packages
bun run build && bun run typecheck && changeset publish
```

### After (Changeset + Workflow)
```bash
bun run changeset              # Same - document changes
bun run workflow:release       # New - automated release execution
```

## Troubleshooting

### Common Issues

1. **Test failures**: Use `--skip-tests` flag if tests are failing but you need to release
2. **Uncommitted changes**: Use `--force` flag to bypass (use with caution)
3. **Existing tags**: Workflow will detect and suggest next available version

### Getting Help
```bash
bunx @g-1/workflow --help           # General help
bunx @g-1/workflow release --help   # Release-specific help
bunx @g-1/workflow status           # Current status
```

## Summary

This integration gives you the best of both worlds:
- **Changesets** for structured change management and team collaboration
- **@g-1/workflow** for reliable, automated release execution

The result is a robust, consistent release process that works the same way locally and in CI/CD, while maintaining clear documentation of all changes.