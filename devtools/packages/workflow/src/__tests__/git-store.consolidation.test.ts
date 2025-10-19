/**
 * Migration test to ensure Git operations consolidation preserves functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GitStore } from '../core/git-store.js'
import { GitOperations } from '@g-1/util/node/git-operations'

describe('GitStore Consolidation Migration', () => {
  let gitStore: GitStore
  let gitOps: GitOperations

  beforeEach(() => {
    gitStore = new GitStore()
    gitOps = new GitOperations()
  })

  it('GitStore should extend GitOperations', () => {
    expect(gitStore).toBeInstanceOf(GitOperations)
  })

  it('should have all required methods from GitOperations', () => {
    // Repository Info
    expect(typeof gitStore.isGitRepository).toBe('function')
    expect(typeof gitStore.getCurrentBranch).toBe('function')
    expect(typeof gitStore.getRemoteUrl).toBe('function')
    expect(typeof gitStore.getRepositoryName).toBe('function')

    // Status & Changes
    expect(typeof gitStore.hasUncommittedChanges).toBe('function')
    expect(typeof gitStore.getChangedFiles).toBe('function')
    expect(typeof gitStore.getStagedFiles).toBe('function')

    // Commits & History
    expect(typeof gitStore.getCommits).toBe('function')
    expect(typeof gitStore.getCommitsSinceTag).toBe('function')

    // Branch Management
    expect(typeof gitStore.createBranch).toBe('function')
    expect(typeof gitStore.switchBranch).toBe('function')
    expect(typeof gitStore.deleteBranch).toBe('function')
    expect(typeof gitStore.getBranches).toBe('function')

    // AI-Powered Suggestions
    expect(typeof gitStore.suggestBranchName).toBe('function')
    expect(typeof gitStore.suggestCommitMessage).toBe('function')

    // Git Operations
    expect(typeof gitStore.stageFiles).toBe('function')
    expect(typeof gitStore.commit).toBe('function')
    expect(typeof gitStore.push).toBe('function')
    expect(typeof gitStore.createTag).toBe('function')
    expect(typeof gitStore.pushTags).toBe('function')

    // GitHub Integration
    expect(typeof gitStore.createPullRequest).toBe('function')
    expect(typeof gitStore.mergePullRequest).toBe('function')
    expect(typeof gitStore.closePullRequest).toBe('function')

    // Cleanup Operations
    expect(typeof gitStore.cleanupFeatureBranch).toBe('function')
  })

  it('should have workflow-specific methods', () => {
    expect(typeof gitStore.getCurrentVersion).toBe('function')
  })

  it('should preserve inheritance chain', () => {
    expect(gitStore instanceof GitStore).toBe(true)
    expect(gitStore instanceof GitOperations).toBe(true)
  })
})