import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Use dynamic imports with vi.doMock for proper hoisting
vi.doMock('commander', () => ({
  Command: vi.fn(() => {
    let _mockActionHandler: any = null
    let mockDescription = ''
    let mockName = ''
    const mockOptions: any[] = []

    const instance = {
      name: vi.fn((value?: string) => {
        if (value !== undefined) {
          mockName = value
          return instance
        }
        return mockName
      }),
      description: vi.fn((value?: string) => {
        if (value !== undefined) {
          mockDescription = value
          return instance
        }
        return mockDescription
      }),
      option: vi.fn((flags: string, description: string, defaultValue?: any) => {
        mockOptions.push({ flags, description, defaultValue })
        return instance
      }),
      action: vi.fn((handler: any) => {
        _mockActionHandler = handler
        return instance
      }),
      getActionHandler: vi.fn(() => _mockActionHandler),
      getMockOptions: vi.fn(() => mockOptions),
      getMockDescription: vi.fn(() => mockDescription),
      getMockName: vi.fn(() => mockName),
    }

    return instance
  }),
}))

vi.doMock('fs-extra', () => {
  const mockFsExtra = {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    pathExists: vi.fn(),
    readdir: vi.fn(),
  }
  return {
    default: mockFsExtra,
    ...mockFsExtra,
  }
})

vi.doMock('path', () => ({
  default: {
    join: vi.fn(),
    resolve: vi.fn(),
    dirname: vi.fn(),
  },
  join: vi.fn(),
  resolve: vi.fn(),
  dirname: vi.fn(),
}))

vi.doMock('child_process', () => ({
  execSync: vi.fn(),
}))

vi.doMock('os', () => ({
  platform: vi.fn(),
  arch: vi.fn(),
  totalmem: vi.fn(),
  cpus: vi.fn(),
}))

vi.doMock('../utils/file-system.js', () => ({
  readJsonFile: vi.fn(),
  getDirectorySize: vi.fn(),
  formatFileSize: vi.fn(),
}))

vi.doMock('../utils/package-manager.js', () => ({
  detectPackageManager: vi.fn(),
  getAvailablePackageManagers: vi.fn(),
}))

vi.doMock('../utils/git.js', () => ({
  isGitRepository: vi.fn(),
  getGitUserInfo: vi.fn(),
}))

vi.doMock('../utils/logger.js', () => {
  const mockLogger = {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    header: vi.fn(),
    subheader: vi.fn(),
    listItem: vi.fn(),
    newLine: vi.fn(),
  }

  return {
    Logger: vi.fn().mockImplementation(() => mockLogger),
    logger: mockLogger,
  }
})

// Dynamic imports
// Import the Command class after mocking
const { Command: _Command } = await import('commander')
const fs = await import('fs-extra')
const path = await import('node:path')
const { Logger } = await import('../utils/logger.js')
const { detectPackageManager, getAvailablePackageManagers } = await import(
  '../utils/package-manager.js'
)
const { isGitRepository, getGitUserInfo } = await import('../utils/git.js')
const { readJsonFile, getDirectorySize, formatFileSize } = await import('../utils/file-system.js')
const { createInfoCommand } = await import('./info')

const mockFs = fs as any
const mockPath = path as any
const { Logger: MockLoggerClass } = await import('../utils/logger.js')
const mockLogger = vi.mocked(MockLoggerClass).mock.results[0]?.value || {
  header: vi.fn(),
  subheader: vi.fn(),
  listItem: vi.fn(),
  newLine: vi.fn(),
  error: vi.fn(),
}
const mockDetectPackageManager = detectPackageManager as any
const mockGetAvailablePackageManagers = getAvailablePackageManagers as any
const mockIsGitRepository = isGitRepository as any
const mockGetGitUserInfo = getGitUserInfo as any
const mockReadJsonFile = readJsonFile as any
const mockGetDirectorySize = getDirectorySize as any
const mockFormatFileSize = formatFileSize as any

// Mock Logger constructor - use the mock from the doMock
vi.mocked(Logger).mockImplementation(() => mockLogger as any)

describe('info Command', () => {
  let infoCommand: Command
  let consoleSpy: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Mock process methods
    vi.spyOn(process, 'cwd').mockReturnValue('/test/project')
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any)

    // Mock console.log for JSON output
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // Mock path.join - both default and named exports
    mockPath.join.mockImplementation((...args: string[]) => {
      return args.join('/')
    })
    mockPath.default.join.mockImplementation((...args: string[]) => {
      return args.join('/')
    })

    // Mock fs-extra - both default and named exports
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync.mockReturnValue('{}')
    mockFs.pathExists.mockResolvedValue(true)
    mockFs.readdir.mockResolvedValue([])
    mockFs.default.existsSync.mockReturnValue(true)
    mockFs.default.readFileSync.mockReturnValue('{}')
    mockFs.default.pathExists.mockResolvedValue(true)
    mockFs.default.readdir.mockResolvedValue([])

    // Mock execSync for git commands
    const { execSync } = await import('node:child_process')
    const mockExecSync = execSync as any
    mockExecSync.mockImplementation((command: string) => {
      if (command === 'git branch --show-current') return 'main'
      if (command === 'git config --get remote.origin.url')
        return 'https://github.com/user/repo.git'
      if (command === 'git log -1 --format="%h %s"') return 'abc1234 Initial commit'
      return ''
    })

    // Default mocks
    mockDetectPackageManager.mockResolvedValue('npm')
    mockGetAvailablePackageManagers.mockResolvedValue(['npm', 'yarn'])
    mockIsGitRepository.mockResolvedValue(false)
    mockReadJsonFile.mockResolvedValue(null)

    infoCommand = createInfoCommand()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('command Configuration', () => {
    it('should be configured with correct description and options', () => {
      expect(infoCommand.description()).toBe('Display project and environment information')

      const options = infoCommand.options
      const optionNames = options.map(opt => opt.long)

      expect(optionNames).toContain('--verbose')
      expect(optionNames).toContain('--json')
    })
  })

  describe('basic Project Information', () => {
    it('should gather basic project information from package.json', async () => {
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project description',
        type: 'module',
        main: 'index.js',
        scripts: { start: 'node index.js', test: 'vitest' },
        dependencies: { express: '^4.18.0' },
        devDependencies: { vitest: '^0.34.0' },
      }

      mockReadJsonFile.mockResolvedValue(mockPackageJson)

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      expect(mockReadJsonFile).toHaveBeenCalledWith('/test/project/package.json')
      expect(mockLogger.header).toHaveBeenCalledWith('📊 Project Information')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Name: test-project')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Version: 1.0.0')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Description: Test project description')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Type: module')
    })

    it('should handle missing package.json gracefully', async () => {
      mockReadJsonFile.mockResolvedValue(null)

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      expect(mockLogger.header).toHaveBeenCalledWith('📊 Project Information')
      // Should still show environment information
      expect(mockLogger.subheader).toHaveBeenCalledWith('Environment:')
    })

    it('should detect G1 framework projects', async () => {
      const mockPackageJson = {
        name: 'my-g1-project',
        dependencies: { '@g-1/core': '^1.0.0' },
      }

      mockReadJsonFile.mockResolvedValue(mockPackageJson)

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      expect(mockLogger.listItem).toHaveBeenCalledWith('🚀 G1 Framework Project')
    })

    it('should detect G1 projects by name prefix', async () => {
      const mockPackageJson = {
        name: '@g-1/my-plugin',
      }

      mockReadJsonFile.mockResolvedValue(mockPackageJson)

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      expect(mockLogger.listItem).toHaveBeenCalledWith('🚀 G1 Framework Project')
    })
  })

  describe('environment Information', () => {
    it('should display environment information', async () => {
      // Mock process.version
      Object.defineProperty(process, 'version', { value: 'v18.17.0' })

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      expect(mockLogger.subheader).toHaveBeenCalledWith('Environment:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Node.js: v18.17.0')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Package Manager: npm')
    })

    it('should show git information when in git repository', async () => {
      mockIsGitRepository.mockResolvedValue(true)
      mockGetGitUserInfo.mockResolvedValue({ name: 'Test User', email: 'test@example.com' })

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      expect(mockLogger.listItem).toHaveBeenCalledWith('📁 Git Repository')
    })

    it('should handle git version detection', async () => {
      // Mock dynamic import and execSync
      const mockExecSync = vi.fn().mockReturnValue('git version 2.39.0')
      vi.doMock('child_process', () => ({
        execSync: mockExecSync,
      }))

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      // The git version should be detected and displayed
      expect(mockLogger.listItem).toHaveBeenCalledWith(expect.stringContaining('Git:'))
    })
  })

  describe('verbose Mode', () => {
    beforeEach(() => {
      const mockPackageJson = {
        name: 'test-project',
        dependencies: { '@g-1/core': '^1.0.0' },
      }
      mockReadJsonFile.mockResolvedValue(mockPackageJson)
      mockFs.pathExists.mockResolvedValue(true)
      mockFs.readdir.mockResolvedValue(['plugin1.ts', 'plugin2.js', 'readme.md'])
      mockGetDirectorySize.mockResolvedValue(1024 * 1024)
      mockFormatFileSize.mockReturnValue('1.0 MB')
    })

    it('should show additional information in verbose mode', async () => {
      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      expect(mockFs.pathExists).toHaveBeenCalledWith('/test/project/g1.config.js')
      expect(mockFs.pathExists).toHaveBeenCalledWith('/test/project/src/plugins')
    })

    it('should count plugins in verbose mode', async () => {
      // Mock package.json to make it a G1 project
      const mockPackageJson = {
        name: '@g-1/test-project',
        version: '1.0.0',
        dependencies: { '@g-1/core': '^1.0.0' },
      }
      mockReadJsonFile.mockImplementation((path: string) => {
        if (path.includes('package.json')) return Promise.resolve(mockPackageJson)
        return Promise.resolve(null)
      })

      // Mock plugins directory to exist and contain 2 plugin files
      mockFs.pathExists.mockImplementation((path: string) => {
        if (path.includes('src/plugins')) return Promise.resolve(true)
        return Promise.resolve(false)
      })
      mockFs.readdir.mockResolvedValue(['plugin1.ts', 'plugin2.js', 'readme.md'])

      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      // Check that plugins were counted and displayed
      expect(mockLogger.listItem).toHaveBeenCalledWith('🔌 Plugins: 2')
    })

    it('should show project size in verbose mode', async () => {
      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      expect(mockGetDirectorySize).toHaveBeenCalledWith('/test/project')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Size: 1.0 MB')
    })

    it('should show system information in verbose mode', async () => {
      // Mock os module
      const mockOs = {
        totalmem: () => 16 * 1024 * 1024 * 1024, // 16GB
        freemem: () => 8 * 1024 * 1024 * 1024, // 8GB
        cpus: () => [{ model: 'Intel Core i7' }],
      }
      vi.doMock('os', () => mockOs)

      Object.defineProperty(process, 'platform', { value: 'darwin' })
      Object.defineProperty(process, 'arch', { value: 'x64' })

      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      expect(mockLogger.subheader).toHaveBeenCalledWith('System:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Platform: darwin (x64)')
    })

    it('should show TypeScript configuration in verbose mode', async () => {
      const mockTsConfig = {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          strict: true,
        },
      }

      mockReadJsonFile
        .mockResolvedValueOnce({ name: 'test-project' }) // package.json
        .mockResolvedValueOnce(mockTsConfig) // tsconfig.json

      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      // Check that readJsonFile was called twice (package.json and tsconfig.json)
      expect(mockReadJsonFile).toHaveBeenCalledTimes(2)
      expect(mockLogger.listItem).toHaveBeenCalledWith('TypeScript: ES2020/ESNext')
    })

    it('should show git details in verbose mode', async () => {
      mockIsGitRepository.mockResolvedValue(true)
      mockGetGitUserInfo.mockResolvedValue({ name: 'Test User', email: 'test@example.com' })

      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      expect(mockLogger.listItem).toHaveBeenCalledWith('Branch: main')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Last Commit: abc1234 Initial commit')
    })

    it('should show dependency counts in verbose mode', async () => {
      const mockPackageJson = {
        name: 'test-project',
        dependencies: { express: '^4.18.0', lodash: '^4.17.0' },
        devDependencies: { vitest: '^0.34.0', typescript: '^5.0.0', eslint: '^8.0.0' },
      }

      mockReadJsonFile.mockResolvedValue(mockPackageJson)

      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      expect(mockLogger.subheader).toHaveBeenCalledWith('Dependencies:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Production: 2 packages')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Development: 3 packages')
    })
  })

  describe('jSON Output', () => {
    it('should output JSON when --json flag is used', async () => {
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
      }

      mockReadJsonFile.mockResolvedValue(mockPackageJson)

      const actionFn = infoCommand._actionHandler

      await actionFn({ json: true })

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"name": "test-project"'))
      expect(mockLogger.header).not.toHaveBeenCalled()
    })

    it('should include all information in JSON output', async () => {
      const mockPackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: { '@g-1/core': '^1.0.0' },
      }

      mockReadJsonFile.mockResolvedValue(mockPackageJson)
      mockIsGitRepository.mockResolvedValue(true)

      const actionFn = infoCommand._actionHandler

      await actionFn({ json: true })

      const jsonOutput = consoleSpy.mock.calls[0][0]
      const parsedOutput = JSON.parse(jsonOutput)

      expect(parsedOutput).toHaveProperty('project')
      expect(parsedOutput).toHaveProperty('environment')
      expect(parsedOutput).toHaveProperty('system')
      expect(parsedOutput.project.name).toBe('test-project')
      expect(parsedOutput.project.isG1Project).toBe(true)
    })
  })

  describe('error Handling', () => {
    it('should handle errors gracefully', async () => {
      mockReadJsonFile.mockRejectedValue(new Error('File read error'))

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to gather information: File read error')
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    it('should handle non-Error exceptions', async () => {
      mockReadJsonFile.mockRejectedValue('String error')

      const actionFn = infoCommand._actionHandler

      await actionFn({})

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to gather information: String error')
      expect(process.exit).toHaveBeenCalledWith(1)
    })

    it('should handle git command failures gracefully', async () => {
      mockIsGitRepository.mockResolvedValue(true)

      // Mock execSync to throw for git commands
      const { execSync } = await import('node:child_process')
      const mockExecSync = execSync as any
      mockExecSync.mockImplementation(() => {
        throw new Error('Git command failed')
      })

      const actionFn = infoCommand._actionHandler

      // Should not throw, should handle git errors gracefully
      await actionFn({ verbose: true })

      expect(mockLogger.listItem).toHaveBeenCalledWith('📁 Git Repository')
    })

    it('should handle missing plugin directory gracefully', async () => {
      const mockPackageJson = {
        name: 'test-project',
        dependencies: { '@g-1/core': '^1.0.0' },
      }

      mockReadJsonFile.mockResolvedValue(mockPackageJson)
      mockFs.pathExists.mockResolvedValue(false)

      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      // Should not crash when plugins directory doesn't exist
      expect(mockLogger.header).toHaveBeenCalledWith('📊 Project Information')
    })

    it('should handle plugin directory read errors', async () => {
      const mockPackageJson = {
        name: 'test-project',
        dependencies: { '@g-1/core': '^1.0.0' },
      }

      mockReadJsonFile.mockResolvedValue(mockPackageJson)
      mockFs.pathExists.mockResolvedValue(true)
      mockFs.readdir.mockRejectedValue(new Error('Permission denied'))

      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      // Should handle readdir error gracefully and set plugin count to 0
      expect(mockLogger.header).toHaveBeenCalledWith('📊 Project Information')
    })
  })

  describe('tool Version Detection', () => {
    it('should detect available tool versions', async () => {
      const { execSync } = await import('node:child_process')
      const mockExecSync = execSync as any
      mockExecSync
        .mockReturnValueOnce('8.19.2') // npm
        .mockReturnValueOnce('1.22.19') // yarn
        .mockReturnValueOnce('git version 2.39.0') // git

      const actionFn = infoCommand._actionHandler

      await actionFn({ verbose: true })

      expect(mockLogger.listItem).toHaveBeenCalledWith(expect.stringContaining('npm@8.19.2'))
      expect(mockLogger.listItem).toHaveBeenCalledWith(expect.stringContaining('yarn@1.22.19'))
    })

    it('should handle tool version detection failures', async () => {
      const mockExecSync = vi.fn().mockImplementation(() => {
        throw new Error('Command not found')
      })

      vi.doMock('child_process', () => ({
        execSync: mockExecSync,
      }))

      const actionFn = infoCommand._actionHandler

      // Should not crash when tool version detection fails
      await actionFn({})

      expect(mockLogger.header).toHaveBeenCalledWith('📊 Project Information')
    })
  })
})
