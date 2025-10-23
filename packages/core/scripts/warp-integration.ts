#!/usr/bin/env bun

/**
 * WARP Integration Utility
 *
 * This module provides functions that WARP can call to automatically enhance
 * the development workflow. It should be imported and used by WARP before
 * performing code generation or other development tasks.
 */

// Re-export the shared utilities for backward compatibility
export {
  enhanceWorkflow,
  getProjectStatus,
  quickTypecheck,
  type WarpIntegrationOptions,
  WarpIntegrationPoints,
  type WarpIntegrationResult,
} from '@g-1/util/node/warp'

// CLI usage - now handled by g1-warp binary
// This file is kept for backward compatibility of imports only
