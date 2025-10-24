#!/usr/bin/env bun
/**
 * Git utilities for G1 Core API using consolidated @g-1/util
 * This demonstrates how to use the consolidated Git operations
 */

import { createLogger } from '@g-1/util/debug'
import { createGitOperations } from '@g-1/util/node'

const logger = createLogger({ source: 'git-utils', verbose: true })

async function main() {
  const git = createGitOperations()

  try {
    logger.info('Checking repository status...')

    // Check if we're in a Git repository
    const isRepo = await git.isGitRepository()
    if (!isRepo) {
      logger.error('Not a Git repository')
      process.exit(1)
    }

    // Get repository information
    const currentBranch = await git.getCurrentBranch()
    const hasChanges = await git.hasUncommittedChanges()
    const repoName = await git.getRepositoryName()
    const currentVersion = git.getCurrentVersion()

    logger.info('Repository status', {
      repository: repoName,
      branch: currentBranch,
      version: currentVersion,
      hasUncommittedChanges: hasChanges,
    })

    if (hasChanges) {
      const changedFiles = await git.getChangedFiles()
      logger.warn('Uncommitted changes detected', {
        filesCount: changedFiles.length,
        files: changedFiles.slice(0, 5), // Show first 5 files
      })
    }

    // Get recent commits
    const recentCommits = await git.getCommits(undefined, 5)
    logger.info('Recent commits', {
      commitsCount: recentCommits.length,
      latestCommit: recentCommits[0]?.message || 'No commits found',
    })

    // Analyze version bump recommendation
    const analysis = git.analyzeChangesForVersionBump()
    logger.info('Version analysis', {
      recommendedBump: analysis.versionBump,
      changeType: analysis.changeType,
      changesCount: analysis.changesList.length,
    })
  } catch (error) {
    logger.error('Git operation failed', error instanceof Error ? error : new Error(String(error)))
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error)
}

export { main as checkGitStatus }
