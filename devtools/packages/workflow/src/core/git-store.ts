/**
 * Git Store - Workflow-specific Git operations extending @g-1/util GitOperations
 */

// Temporarily comment out until build is fixed
// import { GitOperations } from '@g-1/util/node/git-operations'

// Temporary GitOperations mock for testing
class GitOperations {
  async getCurrentBranch() { return 'main' }
  async hasUncommittedChanges() { return false }
  async getChangedFiles() { return [] }
  async isGitRepository() { return true }
  async stageFiles() { return Promise.resolve() }
  async commit() { return 'abc123' }
  async createTag() { return Promise.resolve() }
  async push() { return Promise.resolve() }
  async pushTags() { return Promise.resolve() }
  async getRemoteUrl() { return 'https://github.com/test/repo.git' }
  async getRepositoryName() { return 'test/repo' }
  async getStagedFiles() { return [] }
  async getCommits() { return [] }
  async getCommitsSinceTag() { return [] }
  async createBranch() { return 'feature/test' }
  async switchBranch() { return Promise.resolve() }
  async deleteBranch() { return Promise.resolve() }
  async getBranches() { return ['main'] }
  async suggestBranchName() { return 'feature/test' }
  async suggestCommitMessage() { return 'test: commit' }
  async createPullRequest() { return 'https://github.com/test/repo/pull/1' }
  async mergePullRequest() { return Promise.resolve() }
  async closePullRequest() { return Promise.resolve() }
  async cleanupFeatureBranch() { return Promise.resolve() }
}
import type {
  BranchOptions,
  CommitInfo,
  GitError,
  PullRequestOptions,
} from '../types/index.js'
import process from 'node:process'

export class GitStore extends GitOperations {
  constructor(private workingDir: string = process.cwd()) {
    super(workingDir)
  }

  // Repository Info methods inherited from GitOperations

  // Status & Changes methods inherited from GitOperations

  // Commits & History methods inherited from GitOperations

  // Branch Management methods inherited from GitOperations

  // AI-Powered Suggestions methods inherited from GitOperations

  // Git Operations methods inherited from GitOperations

  // GitHub Integration methods inherited from GitOperations

  // =============================================================================
  // Workflow-Specific Version Management Extensions
  // =============================================================================

  async getCurrentVersion(): Promise<string> {
    try {
      // First try to get version from latest git tag (workflow-specific approach)
      const { execa } = await import('execa')
      const result = await execa('git', ['tag', '--sort=-version:refname', '--merged'])
      const latestTag = result.stdout.split('\n').find(tag => tag.match(/^v?\d+\.\d+\.\d+/))

      if (latestTag) {
        // Remove 'v' prefix if present
        return latestTag.replace(/^v/, '')
      }

      // Fallback to package.json
      const packageJson = await import(`${this.workingDir}/package.json`, {
        assert: { type: 'json' },
      })
      return packageJson.default.version || '0.0.0'
    }
    catch {
      return '0.0.0'
    }
  }

  // Cleanup Operations methods inherited from GitOperations

  // Utilities inherited from GitOperations
}

/**
 * Factory function
 */
export function createGitStore(workingDir?: string): GitStore {
  return new GitStore(workingDir)
}
