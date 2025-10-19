/**
 * @g-1/util/node/warp - WARP Development Workflow Enhancement
 * 
 * This module provides comprehensive workflow enhancement utilities for WARP
 * when working with G1 projects. It handles TypeScript checking, package linking,
 * dependency management, and provides integration points for automated workflow.
 */

// Core workflow enhancement
export {
  WarpWorkflowEnhancer,
  type ProjectInfo,
  type FixResult
} from './workflow-enhancer'

// Integration utilities for WARP
export {
  enhanceWorkflow,
  quickTypecheck,
  isG1Project,
  getProjectStatus,
  WarpIntegrationPoints,
  type WarpIntegrationOptions,
  type WarpIntegrationResult
} from './integration'