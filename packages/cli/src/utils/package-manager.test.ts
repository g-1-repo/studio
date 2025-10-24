import { execSync } from 'child_process'
import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addDependencies,
  detectPackageManager,
  getAvailablePackageManagers,
  getInstallCommand,
  getPreferredPackageManager,
  getRunCommand,
  hasScript,
  installDependencies,
  isPackageManagerAvailable,
  removeDependencies,
  runScript,
  type PackageManager
} from './package-manager'

// Mock child_process
vi.mock('child_process', () => ({
  execSync: vi.fn()
}))

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn(),
    readJson: vi.fn()
  }
}))

// Mock path
vi.mock('path', () => ({
  default: {
    join: vi.fn((...args) => args.join('/'))
  },
  join: vi.fn((...args) => args.join('/'))
}))

const mockExecSync = vi.mocked(execSync)
const mockFs = vi.mocked(fs)

describe('Package Manager Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock implementations to default behavior
    mockExecSync.mockReturnValue(Buffer.from('1.0.0'))
    mockFs.pathExists.mockResolvedValue(false)
    mockFs.readJson.mockResolvedValue({})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('installDependencies', () => {
    it('should install dependencies with default package manager (bun)', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await installDependencies('/test/project')

      expect(mockExecSync).toHaveBeenCalledWith('bun install', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should install dependencies with specified package manager', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await installDependencies('/test/project', 'npm')

      expect(mockExecSync).toHaveBeenCalledWith('npm install', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should throw error if installation fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Installation failed')
      })

      await expect(installDependencies('/test/project')).rejects.toThrow(
        'Failed to install dependencies: Installation failed'
      )
    })

    it('should handle unknown errors', async () => {
      mockExecSync.mockImplementation(() => {
        throw 'Unknown error'
      })

      await expect(installDependencies('/test/project')).rejects.toThrow(
        'Failed to install dependencies: Unknown error'
      )
    })
  })

  describe('getInstallCommand', () => {
    it('should return correct install command for npm', () => {
      expect(getInstallCommand('npm')).toBe('npm install')
    })

    it('should return correct install command for yarn', () => {
      expect(getInstallCommand('yarn')).toBe('yarn install')
    })

    it('should return correct install command for pnpm', () => {
      expect(getInstallCommand('pnpm')).toBe('pnpm install')
    })

    it('should return correct install command for bun', () => {
      expect(getInstallCommand('bun')).toBe('bun install')
    })

    it('should throw error for unknown package manager', () => {
      expect(() => getInstallCommand('unknown' as PackageManager)).toThrow(
        'Unknown package manager: unknown'
      )
    })
  })

  describe('getRunCommand', () => {
    it('should return correct run command for npm', () => {
      expect(getRunCommand('npm', 'test')).toBe('npm run test')
    })

    it('should return correct run command for yarn', () => {
      expect(getRunCommand('yarn', 'test')).toBe('yarn test')
    })

    it('should return correct run command for pnpm', () => {
      expect(getRunCommand('pnpm', 'test')).toBe('pnpm run test')
    })

    it('should return correct run command for bun', () => {
      expect(getRunCommand('bun', 'test')).toBe('bun run test')
    })

    it('should throw error for unknown package manager', () => {
      expect(() => getRunCommand('unknown' as PackageManager, 'test')).toThrow(
        'Unknown package manager: unknown'
      )
    })
  })

  describe('detectPackageManager', () => {
    it('should detect npm from package-lock.json', async () => {
      mockFs.pathExists.mockImplementation((path: string) => {
        return Promise.resolve(path.includes('package-lock.json'))
      })

      const result = await detectPackageManager('/test/project')

      expect(result).toBe('npm')
    })

    it('should detect yarn from yarn.lock', async () => {
      mockFs.pathExists.mockImplementation((path: string) => {
        return Promise.resolve(path.includes('yarn.lock'))
      })

      const result = await detectPackageManager('/test/project')

      expect(result).toBe('yarn')
    })

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      mockFs.pathExists.mockImplementation((path: string) => {
        return Promise.resolve(path.includes('pnpm-lock.yaml'))
      })

      const result = await detectPackageManager('/test/project')

      expect(result).toBe('pnpm')
    })

    it('should detect bun from bun.lockb', async () => {
      mockFs.pathExists.mockImplementation((path: string) => {
        return Promise.resolve(path.includes('bun.lockb'))
      })

      const result = await detectPackageManager('/test/project')

      expect(result).toBe('bun')
    })

    it('should return null if no lock files found', async () => {
      mockFs.pathExists.mockResolvedValue(false)

      const result = await detectPackageManager('/test/project')

      expect(result).toBeNull()
    })
  })

  describe('isPackageManagerAvailable', () => {
    it('should return true if package manager is available', () => {
      mockExecSync.mockReturnValue('1.0.0')

      const result = isPackageManagerAvailable('npm')

      expect(result).toBe(true)
      expect(mockExecSync).toHaveBeenCalledWith('npm --version', { stdio: 'pipe' })
    })

    it('should return false if package manager is not available', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found')
      })

      const result = isPackageManagerAvailable('npm')

      expect(result).toBe(false)
    })
  })

  describe('getAvailablePackageManagers', () => {
    it('should return list of available package managers', () => {
      mockExecSync.mockReturnValue('1.0.0')

      const result = getAvailablePackageManagers()

      expect(result).toEqual(['npm', 'yarn', 'pnpm', 'bun'])
    })

    it('should filter out unavailable package managers', () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command === 'npm --version' || command === 'bun --version') {
          return '1.0.0'
        }
        throw new Error('Command not found')
      })

      const result = getAvailablePackageManagers()

      expect(result).toEqual(['npm', 'bun'])
    })
  })

  describe('getPreferredPackageManager', () => {
    it('should return bun as preferred if available', () => {
      mockExecSync.mockReturnValue('1.0.0')

      const result = getPreferredPackageManager()

      expect(result).toBe('bun')
    })

    it('should fallback to npm if bun is not available', () => {
      mockExecSync.mockImplementation((command: string) => {
        if (command === 'bun --version' || command === 'pnpm --version' || command === 'yarn --version') {
          throw new Error('Command not found')
        }
        return '1.0.0'
      })

      const result = getPreferredPackageManager()

      expect(result).toBe('npm')
    })
  })

  describe('addDependencies', () => {
    it('should add production dependencies', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await addDependencies('/test/project', ['express', 'lodash'])

      expect(mockExecSync).toHaveBeenCalledWith('bun add express lodash', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should add dev dependencies', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await addDependencies('/test/project', ['jest', 'typescript'], { dev: true })

      expect(mockExecSync).toHaveBeenCalledWith('bun add --dev jest typescript', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should use specified package manager', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await addDependencies('/test/project', ['express'], { packageManager: 'npm' })

      expect(mockExecSync).toHaveBeenCalledWith('npm install express', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should throw error if adding dependencies fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Add failed')
      })

      await expect(addDependencies('/test/project', ['express'])).rejects.toThrow(
        'Failed to add dependencies: Add failed'
      )
    })
  })

  describe('removeDependencies', () => {
    it('should remove dependencies', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await removeDependencies('/test/project', ['express', 'lodash'])

      expect(mockExecSync).toHaveBeenCalledWith('bun remove express lodash', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should use specified package manager', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await removeDependencies('/test/project', ['express'], 'npm')

      expect(mockExecSync).toHaveBeenCalledWith('npm uninstall express', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should throw error if removing dependencies fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Remove failed')
      })

      await expect(removeDependencies('/test/project', ['express'])).rejects.toThrow(
        'Failed to remove dependencies: Remove failed'
      )
    })
  })

  describe('runScript', () => {
    it('should run script with default package manager', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await runScript('/test/project', 'test')

      expect(mockExecSync).toHaveBeenCalledWith('bun run test', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should run script with specified package manager', async () => {
      mockExecSync.mockReturnValue(Buffer.from(''))

      await runScript('/test/project', 'build', 'npm')

      expect(mockExecSync).toHaveBeenCalledWith('npm run build', {
        cwd: '/test/project',
        stdio: 'inherit'
      })
    })

    it('should throw error if script execution fails', async () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Script failed')
      })

      await expect(runScript('/test/project', 'test')).rejects.toThrow(
        'Failed to run script: Script failed'
      )
    })
  })

  describe('hasScript', () => {
    it('should return true if script exists in package.json', async () => {
      const mockPackageJson = {
        scripts: {
          test: 'vitest',
          build: 'tsc'
        }
      }

      mockFs.readJson.mockResolvedValue(mockPackageJson)

      const result = await hasScript('/test/project', 'test')

      expect(result).toBe(true)
      expect(mockFs.readJson).toHaveBeenCalledWith('/test/project/package.json')
    })

    it('should return false if script does not exist', async () => {
      const mockPackageJson = {
        scripts: {
          build: 'tsc'
        }
      }

      mockFs.readJson.mockResolvedValue(mockPackageJson)

      const result = await hasScript('/test/project', 'test')

      expect(result).toBe(false)
    })

    it('should return false if package.json has no scripts', async () => {
      const mockPackageJson = {}

      mockFs.readJson.mockResolvedValue(mockPackageJson)

      const result = await hasScript('/test/project', 'test')

      expect(result).toBe(false)
    })

    it('should return false if package.json cannot be read', async () => {
      mockFs.readJson.mockRejectedValue(new Error('File not found'))

      const result = await hasScript('/test/project', 'test')

      expect(result).toBe(false)
    })
  })
})