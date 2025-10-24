import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import {
  initializeGit,
  isGitAvailable,
  getGitUserInfo,
  isGitRepository,
  gitAddAndCommit,
  createBranch,
  getCurrentBranch,
  hasUncommittedChanges
} from './git'

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn()
}))

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
    writeFile: vi.fn()
  }
}))

// Mock path
vi.mock('path', () => ({
  default: {
    join: vi.fn(),
    resolve: vi.fn(),
    dirname: vi.fn()
  },
  join: vi.fn(),
  resolve: vi.fn(),
  dirname: vi.fn()
}))

const mockExecSync = execSync as any
const mockFs = fs as any
const mockPath = path as any

describe('Git Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock path.join
    mockPath.join.mockImplementation((...args: string[]) => {
      return args.join('/')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initializeGit', () => {
    it('should initialize git repository successfully', async () => {
      mockExecSync.mockReturnValue(undefined)
      mockFs.pathExists.mockResolvedValue(true) // .gitignore exists
      mockPath.join.mockReturnValue('/test/project/.gitignore')

      await initializeGit('/test/project')

      expect(mockExecSync).toHaveBeenCalledWith('git init', {
        cwd: '/test/project',
        stdio: 'pipe'
      })
      expect(mockExecSync).toHaveBeenCalledWith('git add .', {
        cwd: '/test/project',
        stdio: 'pipe'
      })
      expect(mockExecSync).toHaveBeenCalledWith('git commit -m "Initial commit"', {
        cwd: '/test/project',
        stdio: 'pipe'
      })
    })

    it('should create .gitignore if it does not exist', async () => {
      mockExecSync.mockReturnValue(undefined)
      mockFs.pathExists.mockResolvedValue(false) // .gitignore doesn't exist
      mockFs.writeFile.mockResolvedValue(undefined)
      mockPath.join.mockReturnValue('/test/project/.gitignore')

      await initializeGit('/test/project')

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '/test/project/.gitignore',
        expect.stringContaining('node_modules/')
      )
    })

    it('should throw error if git initialization fails', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command === 'git init') {
          throw new Error('Git init failed')
        }
        return undefined
      })

      await expect(initializeGit('/test/project')).rejects.toThrow(
        'Failed to initialize git repository: Git init failed'
      )
    })

    it('should handle unknown errors', async () => {
      mockExecSync.mockImplementation(() => {
        throw 'Unknown error'
      })

      await expect(initializeGit('/test/project')).rejects.toThrow(
        'Failed to initialize git repository: Unknown error'
      )
    })
  })

  describe('isGitAvailable', () => {
    it('should return true if git is available', () => {
      mockExecSync.mockReturnValue('git version 2.30.0')

      const result = isGitAvailable()

      expect(result).toBe(true)
      expect(mockExecSync).toHaveBeenCalledWith('git --version', { stdio: 'pipe' })
    })

    it('should return false if git is not available', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found')
      })

      const result = isGitAvailable()

      expect(result).toBe(false)
    })
  })

  describe('getGitUserInfo', () => {
    it('should return git user name and email', () => {
      mockExecSync
        .mockReturnValueOnce('John Doe\n')
        .mockReturnValueOnce('john.doe@example.com\n')

      const result = getGitUserInfo()

      expect(result).toEqual({
        name: 'John Doe',
        email: 'john.doe@example.com'
      })
      expect(mockExecSync).toHaveBeenCalledWith('git config user.name', {
        stdio: 'pipe',
        encoding: 'utf-8'
      })
      expect(mockExecSync).toHaveBeenCalledWith('git config user.email', {
        stdio: 'pipe',
        encoding: 'utf-8'
      })
    })

    it('should return empty object if git config fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Git config failed')
      })

      const result = getGitUserInfo()

      expect(result).toEqual({})
    })

    it('should handle partial git config', () => {
      mockExecSync
        .mockReturnValueOnce('John Doe\n')
        .mockImplementationOnce(() => {
          throw new Error('No email configured')
        })

      const result = getGitUserInfo()

      expect(result).toEqual({ name: 'John Doe' })
    })
  })

  describe('isGitRepository', () => {
    it('should return true if directory is a git repository', async () => {
      mockFs.pathExists.mockResolvedValue(true)

      const result = await isGitRepository('/test/project')

      expect(result).toBe(true)
      expect(mockFs.pathExists).toHaveBeenCalledWith('/test/project/.git')
    })

    it('should return false if directory is not a git repository', async () => {
      mockFs.pathExists.mockResolvedValue(false)

      const result = await isGitRepository('/test/project')

      expect(result).toBe(false)
    })

    it('should handle fs.pathExists errors', async () => {
      mockFs.pathExists.mockRejectedValue(new Error('Permission denied'))

      const result = await isGitRepository('/test/project')

      expect(result).toBe(false)
    })
  })

  describe('gitAddAndCommit', () => {
    it('should add and commit files with default files', async () => {
      mockExecSync.mockReturnValue(undefined)

      await gitAddAndCommit('/test/project', 'Test commit')

      expect(mockExecSync).toHaveBeenCalledWith('git add .', {
        cwd: '/test/project',
        stdio: 'pipe'
      })
      expect(mockExecSync).toHaveBeenCalledWith('git commit -m "Test commit"', {
        cwd: '/test/project',
        stdio: 'pipe'
      })
    })

    it('should add and commit specific files', async () => {
      mockExecSync.mockReturnValue(undefined)

      await gitAddAndCommit('/test/project', 'Test commit', ['file1.js', 'file2.js'])

      expect(mockExecSync).toHaveBeenCalledWith('git add file1.js file2.js', {
        cwd: '/test/project',
        stdio: 'pipe'
      })
      expect(mockExecSync).toHaveBeenCalledWith('git commit -m "Test commit"', {
        cwd: '/test/project',
        stdio: 'pipe'
      })
    })

    it('should throw error if git add fails', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.startsWith('git add')) {
          throw new Error('Git add failed')
        }
        return undefined
      })

      await expect(gitAddAndCommit('/test/project', 'Test commit')).rejects.toThrow(
        'Failed to add and commit files: Git add failed'
      )
    })

    it('should throw error if git commit fails', async () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command.startsWith('git commit')) {
          throw new Error('Git commit failed')
        }
        return undefined
      })

      await expect(gitAddAndCommit('/test/project', 'Test commit')).rejects.toThrow(
        'Failed to add and commit files: Git commit failed'
      )
    })
  })

  describe('createBranch', () => {
    it('should create and checkout new branch', async () => {
      mockExecSync.mockReturnValue(undefined)

      await createBranch('/test/project', 'feature-branch')

      expect(mockExecSync).toHaveBeenCalledWith('git checkout -b feature-branch', {
        cwd: '/test/project',
        stdio: 'pipe'
      })
    })

    it('should throw error if branch creation fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Branch creation failed')
      })

      await expect(createBranch('/test/project', 'feature-branch')).rejects.toThrow(
        'Failed to create branch: Branch creation failed'
      )
    })
  })

  describe('getCurrentBranch', () => {
    it('should return current branch name', () => {
      mockExecSync.mockReturnValue('main\n')

      const result = getCurrentBranch('/test/project')

      expect(result).toBe('main')
      expect(mockExecSync).toHaveBeenCalledWith('git rev-parse --abbrev-ref HEAD', {
        cwd: '/test/project',
        stdio: 'pipe',
        encoding: 'utf-8'
      })
    })

    it('should return null if getting branch fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Not a git repository')
      })

      const result = getCurrentBranch('/test/project')

      expect(result).toBeNull()
    })

    it('should handle empty branch name', () => {
      mockExecSync.mockReturnValue('')

      const result = getCurrentBranch('/test/project')

      expect(result).toBeNull()
    })
  })

  describe('hasUncommittedChanges', () => {
    it('should return true if there are uncommitted changes', () => {
      mockExecSync.mockReturnValue('M  file1.js\nA  file2.js\n')

      const result = hasUncommittedChanges('/test/project')

      expect(result).toBe(true)
      expect(mockExecSync).toHaveBeenCalledWith('git status --porcelain', {
        cwd: '/test/project',
        stdio: 'pipe',
        encoding: 'utf-8'
      })
    })

    it('should return false if there are no uncommitted changes', () => {
      mockExecSync.mockReturnValue('')

      const result = hasUncommittedChanges('/test/project')

      expect(result).toBe(false)
    })

    it('should return false if git status fails', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Not a git repository')
      })

      const result = hasUncommittedChanges('/test/project')

      expect(result).toBe(false)
    })

    it('should handle whitespace in git status output', () => {
      mockExecSync.mockReturnValue('   \n  \n')

      const result = hasUncommittedChanges('/test/project')

      expect(result).toBe(false)
    })
  })
})