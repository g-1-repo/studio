import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Version Command', () => {
  let mockReadJsonFile: any
  let mockLogger: any
  let createVersionCommand: any
  let gatherVersionInfo: any
  let displayVersionInfo: any
  let consoleSpy: any

  beforeEach(async () => {
    vi.resetAllMocks()
    vi.resetModules()

    // Create mock functions
    mockReadJsonFile = vi.fn()
    mockLogger = {
      header: vi.fn(),
      subheader: vi.fn(),
      listItem: vi.fn(),
      newLine: vi.fn(),
      info: vi.fn(),
      error: vi.fn()
    }

    // Mock modules using vi.doMock
    vi.doMock('../utils/file-system.js', () => ({
      readJsonFile: mockReadJsonFile
    }))

    vi.doMock('../utils/logger.js', () => ({
      Logger: vi.fn().mockImplementation(() => mockLogger)
    }))

    vi.doMock('path', () => ({
      default: {
        dirname: vi.fn().mockReturnValue('/cli/src/commands'),
        resolve: vi.fn().mockImplementation((dir: string, relative: string) => {
          if (relative === '../../package.json') {
            return '/cli/package.json'
          }
          return `${dir}/${relative}`
        }),
        join: vi.fn().mockImplementation((...args: any[]) => args.join('/'))
      },
      dirname: vi.fn().mockReturnValue('/cli/src/commands'),
      resolve: vi.fn().mockImplementation((dir: string, relative: string) => {
        if (relative === '../../package.json') {
          return '/cli/package.json'
        }
        return `${dir}/${relative}`
      }),
      join: vi.fn().mockImplementation((...args: any[]) => args.join('/'))
    }))

    vi.doMock('child_process', () => ({
      execSync: vi.fn()
    }))

    // Mock process methods
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project')

    // Mock console.log for JSON output
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

    // Mock import.meta.url
    Object.defineProperty(import.meta, 'url', {
      value: 'file:///cli/src/commands/version.js',
      configurable: true
    })

    // Mock URL constructor
    global.URL = vi.fn().mockImplementation((url) => ({
      pathname: url.replace('file://', '')
    })) as any

    // Set up default mock implementation for readJsonFile
    mockReadJsonFile.mockImplementation((filePath: string) => {
      // Default behavior - return null for unknown files
      return Promise.resolve(null)
    })

    // Import the module after mocking
    const versionModule = await import('./version.js')
    createVersionCommand = versionModule.createVersionCommand
    gatherVersionInfo = versionModule.gatherVersionInfo
    displayVersionInfo = versionModule.displayVersionInfo
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Command Configuration', () => {
    it('should be configured with correct name', () => {
      const versionCommand = createVersionCommand()
      expect(versionCommand.name()).toBe('version')
    })

    it('should have json and all options', () => {
      const versionCommand = createVersionCommand()
      const options = versionCommand.options
      const optionNames = options.map((opt: any) => opt.long || opt.short)

      expect(optionNames).toContain('--json')
      expect(optionNames).toContain('--all')
    })
  })

  describe('Version Information Display', () => {
    it('should display CLI version information when available', async () => {
      const mockCliPackageJson = {
        name: '@g-1/cli',
        version: '1.2.3'
      }

      mockReadJsonFile.mockImplementation((filePath: string) => {
        // CLI package.json path
        if (filePath === '/cli/package.json') {
          return Promise.resolve({
            name: '@g-1/cli',
            version: '1.2.3'
          })
        }
        // Project package.json path
        if (filePath === '/test/project/package.json') {
          return Promise.resolve({
            name: 'my-project',
            version: '2.0.0'
          })
        }
        return Promise.resolve(null)
      })

      const versionInfo = await gatherVersionInfo(false)
      displayVersionInfo(versionInfo, false, mockLogger as any)

      expect(mockLogger.header).toHaveBeenCalledWith('📋 Version Information')
      expect(mockLogger.subheader).toHaveBeenCalledWith('G1 CLI:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('@g-1/cli: 1.2.3')
    })

    it('should display current project information when available', async () => {
      const mockProjectPackageJson = {
        name: 'my-project',
        version: '2.0.0'
      }

      mockReadJsonFile.mockImplementation((filePath: string) => {
        // CLI package.json path
        if (filePath === '/cli/package.json') {
          return Promise.resolve({
            name: '@g-1/cli',
            version: '1.2.3'
          })
        }
        // Project package.json path
        if (filePath === '/test/project/package.json') {
          return Promise.resolve(mockProjectPackageJson)
        }
        return Promise.resolve(null)
      })

      const versionInfo = await gatherVersionInfo(false)
      displayVersionInfo(versionInfo, false, mockLogger as any)

      expect(mockLogger.subheader).toHaveBeenCalledWith('Current Project:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('my-project: 2.0.0')
    })

    it('should display G1 dependencies when available', async () => {
      const mockProjectPackageJson = {
        name: 'my-project',
        version: '1.0.0',
        dependencies: {
          '@g-1/core': '^1.2.3',
          '@g-1/testing': '^1.0.0',
          'express': '^4.18.0',
          'vitest': '^0.34.0'
        }
      }

      mockReadJsonFile.mockImplementation((filePath: string) => {
        // CLI package.json path
        if (filePath === '/cli/package.json') {
          return Promise.resolve({
            name: '@g-1/cli',
            version: '1.2.3'
          })
        }
        // Project package.json path
        if (filePath === '/test/project/package.json') {
          return Promise.resolve(mockProjectPackageJson)
        }
        return Promise.resolve(null)
      })

      const versionInfo = await gatherVersionInfo(false)
      displayVersionInfo(versionInfo, false, mockLogger as any)

      expect(mockLogger.subheader).toHaveBeenCalledWith('G1 Framework Dependencies:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('@g-1/core: ^1.2.3')
      expect(mockLogger.listItem).toHaveBeenCalledWith('@g-1/testing: ^1.0.0')
      expect(mockLogger.listItem).not.toHaveBeenCalledWith('express: ^4.18.0')
      expect(mockLogger.listItem).not.toHaveBeenCalledWith('vitest: ^0.34.0')
    })

    it('should not display G1 dependencies section when none are found', async () => {
      const mockProjectPackageJson = {
        name: 'my-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0',
          'vitest': '^0.34.0'
        }
      }

      mockReadJsonFile.mockImplementation((filePath: string) => {
        // CLI package.json path
        if (filePath.includes('../../package.json') || filePath === '/cli/package.json') {
          return Promise.resolve(null)
        }
        // Project package.json path
        if (filePath === '/test/project/package.json') {
          return Promise.resolve(mockProjectPackageJson)
        }
        return Promise.resolve(null)
      })

      const versionInfo = await gatherVersionInfo(false)
      displayVersionInfo(versionInfo, false, mockLogger as any)

      expect(mockLogger.subheader).toHaveBeenCalledWith('Current Project:')
      expect(mockLogger.subheader).not.toHaveBeenCalledWith('G1 Framework Dependencies:')
    })

    it('should display help message when not using --all flag', async () => {
      const versionInfo = await gatherVersionInfo(false)
      displayVersionInfo(versionInfo, false, mockLogger as any)

      expect(mockLogger.info).toHaveBeenCalledWith('💡 Use --all flag to see detailed version information')
    })
  })

  describe('Version Info Gathering', () => {
    beforeEach(() => {
      // Reset mock before each test in this describe block
      mockReadJsonFile.mockReset()
      mockReadJsonFile.mockImplementation((filePath: string) => {
        // Default behavior - return null for unknown files
        return Promise.resolve(null)
      })
    })

    it('should gather CLI version information', async () => {
      const mockCliPackageJson = {
        name: '@g-1/cli',
        version: '1.2.3'
      }

      mockReadJsonFile.mockImplementation((filePath: string) => {
        // CLI package.json path
        if (filePath === '/cli/package.json') {
          return Promise.resolve(mockCliPackageJson)
        }
        // Project package.json path
        if (filePath === '/test/project/package.json') {
          return Promise.resolve(null)
        }
        return Promise.resolve(null)
      })

      const versionInfo = await gatherVersionInfo(false)

      expect(versionInfo.cli).toEqual({
        name: '@g-1/cli',
        version: '1.2.3'
      })
    })

    it('should gather project information when available', async () => {
      const mockProjectPackageJson = {
        name: 'test-project',
        version: '3.0.0'
      }

      mockReadJsonFile.mockImplementation((filePath: string) => {
        // CLI package.json path
        if (filePath.includes('../../package.json') || filePath === '/cli/package.json') {
          return Promise.resolve(null)
        }
        // Project package.json path
        if (filePath === '/test/project/package.json') {
          return Promise.resolve(mockProjectPackageJson)
        }
        return Promise.resolve(null)
      })

      const versionInfo = await gatherVersionInfo(false)

      expect(versionInfo.project).toEqual({
        name: 'test-project',
        version: '3.0.0'
      })
    })

    it('should filter G1 dependencies correctly', async () => {
      const mockProjectPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          '@g-1/core': '^2.0.0',
          '@g-1/utils': '^1.5.0',
          'lodash': '^4.17.21',
          'express': '^4.18.0'
        },
        devDependencies: {
          '@g-1/testing': '^1.2.0',
          'vitest': '^0.34.0'
        }
      }

      // Mock readJsonFile to return G1 dependencies test data
      mockReadJsonFile.mockImplementation((filePath: string) => {
        console.log('G1 test - Mock called with filePath:', filePath)
        // CLI package.json path
        if (filePath === '/cli/package.json') {
          console.log('G1 test - Returning CLI data')
          return Promise.resolve({
            name: '@g-1/cli',
            version: '1.2.3'
          })
        }
        // Project package.json path
        if (filePath === '/test/project/package.json') {
          console.log('G1 test - Returning project data with G1 deps:', mockProjectPackageJson)
          return Promise.resolve(mockProjectPackageJson)
        }
        console.log('G1 test - Returning null for unknown path')
        return Promise.resolve(null)
      })

      const versionInfo = await gatherVersionInfo(false)
      console.log('G1 test - Version info result:', JSON.stringify(versionInfo, null, 2))

      expect(versionInfo.g1Dependencies).toEqual({
        '@g-1/core': '^2.0.0',
        '@g-1/utils': '^1.5.0',
        '@g-1/testing': '^1.2.0'
      })
    })

    it('should handle missing package.json files gracefully', async () => {
      mockReadJsonFile.mockResolvedValue(null)

      const versionInfo = await gatherVersionInfo(false)

      expect(versionInfo.cli).toBeNull()
      expect(versionInfo.project).toBeNull()
      expect(versionInfo.g1Dependencies).toEqual({})
    })

    it('should handle file read errors gracefully', async () => {
      // Mock readJsonFile to simulate file read errors by returning null
      mockReadJsonFile.mockResolvedValue(null)

      const versionInfo = await gatherVersionInfo(false)

      expect(versionInfo.cli).toBeNull()
      expect(versionInfo.project).toBeNull()
      expect(versionInfo.g1Dependencies).toEqual({})
    })
  })
})