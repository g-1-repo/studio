/**
 * Test suite for ReleaseWorkflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createReleaseWorkflow, hasNpmPublishingWorkflow, detectCloudflareSetup } from '../workflows/release.js'

// Mock Git operations
vi.mock('@g-1/util/node', () => ({
  createGitOperations: () => ({
    hasUncommittedChanges: vi.fn().mockResolvedValue(false),
    getChangedFiles: vi.fn().mockResolvedValue([]),
    stageFiles: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue('abc123')
  })
}))

describe('Release Workflow', () => {

  describe('createReleaseWorkflow', () => {
    it('should create release workflow steps', async () => {
      const steps = await createReleaseWorkflow()
      expect(steps).toBeDefined()
      expect(Array.isArray(steps)).toBe(true)
      expect(steps.length).toBeGreaterThan(0)
    })

    it('should accept custom options', async () => {
      const options = {
        skipTests: true,
        skipLint: true,
        force: true
      }

      const steps = await createReleaseWorkflow(options)
      expect(steps).toBeDefined()
      expect(Array.isArray(steps)).toBe(true)
    })

    it('should handle non-interactive mode', async () => {
      const options = {
        nonInteractive: true,
        force: true
      }

      const steps = await createReleaseWorkflow(options)
      expect(steps).toBeDefined()
    })
  })

  describe('workflow steps', () => {
    it('should include quality gates', async () => {
      const steps = await createReleaseWorkflow()
      const stepTitles = steps.map(step => step.title.toLowerCase())
      
      // Should include quality gates step
      expect(stepTitles.some(title => title.includes('quality'))).toBe(true)
    })

    it('should include git operations', async () => {
      const steps = await createReleaseWorkflow()
      const stepTitles = steps.map(step => step.title.toLowerCase())
      
      // Should include git-related steps
      expect(stepTitles.some(title => title.includes('git') || title.includes('tag') || title.includes('push'))).toBe(true)
    })
  })

  describe('detection utilities', () => {
    it('should detect npm publishing workflows', async () => {
      // Test the hasNpmPublishingWorkflow function
      const result = await hasNpmPublishingWorkflow('test/repo')
      expect(typeof result).toBe('boolean')
    })

    it('should detect Cloudflare setup', async () => {
      // Test the detectCloudflareSetup function
      const result = await detectCloudflareSetup()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('workflow options', () => {
    it('should support skipping Cloudflare deployment', async () => {
      const steps = await createReleaseWorkflow({ skipCloudflare: true })
      expect(steps).toBeDefined()
    })

    it('should support forcing execution', async () => {
      const steps = await createReleaseWorkflow({ force: true })
      expect(steps).toBeDefined()
    })
  })
})
