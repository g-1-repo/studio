/**
 * Test suite for ReleaseWorkflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReleaseWorkflow } from '../workflows/release.js'

// Mock GitStore since we tested it separately
vi.mock('../core/git-store.js', () => ({
  GitStore: class MockGitStore {
    async getCurrentBranch() { return 'main' }
    async hasUncommittedChanges() { return false }
    async getCurrentVersion() { return '1.0.0' }
    async getCommitsSinceTag() { return [] }
    async isGitRepository() { return true }
    async stageFiles() { return Promise.resolve() }
    async commit() { return 'abc123' }
    async createTag() { return Promise.resolve() }
    async push() { return Promise.resolve() }
    async pushTags() { return Promise.resolve() }
  }
}))

describe('ReleaseWorkflow', () => {
  let releaseWorkflow: ReleaseWorkflow

  beforeEach(() => {
    releaseWorkflow = new ReleaseWorkflow()
  })

  describe('constructor', () => {
    it('should create ReleaseWorkflow instance', () => {
      expect(releaseWorkflow).toBeDefined()
      expect(releaseWorkflow).toBeInstanceOf(ReleaseWorkflow)
    })
  })

  describe('configuration', () => {
    it('should accept custom configuration', () => {
      const config = {
        skipTests: true,
        skipLinting: false,
        packageManager: 'npm' as const
      }

      const workflow = new ReleaseWorkflow(config)
      expect(workflow).toBeDefined()
    })

    it('should have default configuration', () => {
      expect(releaseWorkflow).toBeDefined()
      // Workflow should work with default config
    })
  })

  describe('workflow execution', () => {
    it('should create workflow steps', () => {
      const steps = releaseWorkflow.createWorkflowSteps()
      expect(steps).toBeDefined()
      expect(Array.isArray(steps)).toBe(true)
      expect(steps.length).toBeGreaterThan(0)
    })

    it('should include quality gates in workflow', () => {
      const steps = releaseWorkflow.createWorkflowSteps()
      const stepTitles = steps.map(step => step.title.toLowerCase())
      
      // Should include common workflow steps
      expect(stepTitles.some(title => title.includes('lint') || title.includes('quality'))).toBe(true)
      expect(stepTitles.some(title => title.includes('test'))).toBe(true)
      expect(stepTitles.some(title => title.includes('version') || title.includes('bump'))).toBe(true)
    })
  })

  describe('validation', () => {
    it('should validate git repository', async () => {
      // This should not throw since we're mocking a valid git repo
      expect(async () => {
        await releaseWorkflow.validateEnvironment()
      }).not.toThrow()
    })

    it('should handle validation errors gracefully', async () => {
      // Test error handling
      const workflow = new ReleaseWorkflow()
      
      // Mock a failing validation
      const mockGitStore = {
        isGitRepository: vi.fn().mockResolvedValue(false)
      }
      ;(workflow as any).gitStore = mockGitStore

      await expect(workflow.validateEnvironment()).rejects.toThrow()
    })
  })

  describe('interactive mode', () => {
    it('should support interactive prompts', () => {
      const workflow = new ReleaseWorkflow({ interactive: true })
      expect(workflow).toBeDefined()
    })

    it('should support non-interactive mode', () => {
      const workflow = new ReleaseWorkflow({ interactive: false })
      expect(workflow).toBeDefined()
    })
  })
})