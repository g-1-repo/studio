# WARP Workflow Enhancement - Extraction Plan

## Summary

The WARP workflow enhancement functionality created in `@g-1/core` should be extracted to `@g-1/util/node` as it's generic development environment utilities that would benefit all G1 projects.

## Target Package: `@g-1/util`

**Why @g-1/util:**

- Contains Node.js development utilities (`./node` export)
- Has environment management utilities (`./env`)
- Includes debug and development helpers (`./debug`)
- Already has a pattern for Node-specific functionality
- Designed for "common G1 business logic and utilities"

**Not @g-1/workflow because:** Workflow is focused on release automation/CI-CD, not development environment setup
**Not @g-1/test because:** Test is for testing utilities and runners, not general dev environment management

## Files to Extract

### From `@g-1/core/scripts/`:

1. **`warp-workflow-enhancer.ts`** → `@g-1/util/src/node/warp-workflow-enhancer.ts`
2. **`warp-integration.ts`** → `@g-1/util/src/node/warp-integration.ts`

### Key Classes/Functions:

- `WarpWorkflowEnhancer` class
- `WarpIntegrationPoints` object
- `enhanceWorkflow()` function
- `quickTypecheck()` function
- `isG1Project()` function
- `getProjectStatus()` function

## Migration Steps

### 1. Add to @g-1/util

```bash
cd /Users/johnnymathis/Developer/g1/util

# Create the warp utilities
mkdir -p src/node/warp
cp ../core/scripts/warp-workflow-enhancer.ts src/node/warp/workflow-enhancer.ts
cp ../core/scripts/warp-integration.ts src/node/warp/integration.ts

# Update imports and exports
# Add to src/node/index.ts:
export * from './warp/workflow-enhancer'
export * from './warp/integration'

# Add to package.json exports:
"./node/warp": {
  "types": "./dist/node/warp/index.d.ts",
  "import": "./dist/node/warp/index.js",
  "require": "./dist/node/warp/index.cjs"
}
```

### 2. Update @g-1/core to use shared package

```bash
cd /Users/johnnymathis/Developer/g1/core

# Update scripts/warp-integration.ts:
import { WarpWorkflowEnhancer, WarpIntegrationPoints } from '@g-1/util/node/warp'

# Update package.json scripts:
"warp:enhance": "bunx @g-1/util/node/warp enhance"
"warp:status": "bunx @g-1/util/node/warp status"
"warp:typecheck": "bunx @g-1/util/node/warp typecheck"
```

### 3. Add CLI Support to @g-1/util

```json
// In @g-1/util/package.json
{
  "bin": {
    "g1-util-mcp": "mcp-server/server.js",
    "g1-warp": "dist/node/warp/cli.js"
  }
}
```

### 4. Update All G1 Projects

Each project gets consistent commands:

```json
{
  "scripts": {
    "warp:enhance": "g1-warp enhance",
    "warp:status": "g1-warp status",
    "warp:typecheck": "g1-warp typecheck"
  }
}
```

## Benefits After Extraction

### For All G1 Projects:

- ✅ Consistent WARP workflow enhancement across all projects
- ✅ Centralized maintenance and updates
- ✅ Reduced duplication
- ✅ Standardized development environment setup

### For WARP:

- ✅ Import from `@g-1/util/node/warp` in any G1 project
- ✅ Consistent API across all projects
- ✅ Single source of truth for workflow enhancement

## API After Extraction

```typescript
// Any G1 project can import:
import {
  enhanceWorkflow,
  getProjectStatus,
  isG1Project,
  quickTypecheck,
  WarpIntegrationPoints,
  WarpWorkflowEnhancer
} from '@g-1/util/node/warp'

// WARP integration points remain the same:
await WarpIntegrationPoints.beforeCodeWork()
await WarpIntegrationPoints.afterCodeWork()
await WarpIntegrationPoints.onTypescriptError()
```

## Implementation Timeline

1. **Phase 1**: Extract to `@g-1/util` (1-2 hours)
2. **Phase 2**: Update `@g-1/core` to use shared version (30 minutes)
3. **Phase 3**: Document pattern for other G1 projects (30 minutes)
4. **Phase 4**: Update WARP.md with new consolidation guidance (30 minutes)

## Consolidation Detection Rules for AI

### When to Extract to Shared Packages:

1. **Utilities that work across multiple G1 projects** → `@g-1/util`
2. **Testing helpers and runners** → `@g-1/test`
3. **Release/CI-CD workflow tools** → `@g-1/workflow`

### Red Flags for Extraction:

- Code exists in 2+ G1 projects with similar functionality
- Development environment setup/validation utilities
- Package management and dependency linking
- TypeScript compilation and validation helpers
- Cross-project development workflow automation

### How AI Should Approach Consolidation:

1. **Detect duplication patterns**
2. **Analyze functionality scope** (single project vs multi-project)
3. **Choose appropriate shared package** based on purpose
4. **Create extraction plan** like this document
5. **Propose PR with migration steps** for human review

## Post-Extraction Validation

### Tests to Run:

```bash
# In @g-1/util
bun run test
bun run build
bun run typecheck

# In @g-1/core
bun run warp:enhance
bun run warp:status
bun run test:ci

# In other G1 projects
g1-warp status
g1-warp enhance
```

### Success Criteria:

- ✅ All G1 projects can use `@g-1/util/node/warp`
- ✅ No functionality loss from original implementation
- ✅ Consistent API across all projects
- ✅ WARP can import and use from any G1 project
- ✅ CLI tools work globally via `g1-warp` command
