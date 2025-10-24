import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Use dynamic imports to avoid hoisting issues
let mockActionHandler: any = null

vi.doMock('commander', () => ({
  Command: vi.fn().mockImplementation((_name?: string) => {
    const instance = {
      name: vi.fn().mockReturnThis(),
      description: vi.fn().mockImplementation((desc?: string) => {
        if (desc !== undefined) {
          instance._description = desc
          return instance
        }
        return instance._description
      }),
      argument: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      action: vi.fn().mockImplementation(handler => {
        mockActionHandler = handler
        instance._actionHandler = handler
        return instance
      }),
      _actionHandler: null,
      _description: '',
      options: [
        { long: '--template' },
        { long: '--directory' },
        { long: '--no-git' },
        { long: '--no-install' },
        { long: '--package-manager' },
        { long: '--typescript' },
        { long: '--no-eslint' },
        { long: '--no-prettier' },
      ],
    }
    return instance
  }),
}))

vi.doMock('inquirer', () => ({
  default: {
    prompt: vi.fn(),
  },
}))

vi.doMock('../utils/validation.js', () => ({
  validateProjectName: vi.fn(),
}))

vi.doMock('../generators/project.js', () => ({
  createProject: vi.fn(),
}))

vi.doMock('../utils/logger.js', () => ({
  Logger: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    startSpinner: vi.fn(),
    updateSpinner: vi.fn(),
    succeedSpinner: vi.fn(),
    failSpinner: vi.fn(),
    stopSpinner: vi.fn(),
    header: vi.fn(),
    subheader: vi.fn(),
    listItem: vi.fn(),
    newLine: vi.fn(),
    code: vi.fn(),
    table: vi.fn(),
  })),
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    startSpinner: vi.fn(),
    updateSpinner: vi.fn(),
    succeedSpinner: vi.fn(),
    failSpinner: vi.fn(),
    stopSpinner: vi.fn(),
    header: vi.fn(),
    subheader: vi.fn(),
    listItem: vi.fn(),
    newLine: vi.fn(),
    code: vi.fn(),
    table: vi.fn(),
  },
}))

// Import modules after mocking
const { Command: _Command } = await import('commander')
const inquirer = await import('inquirer')
const { logger } = await import('../utils/logger.js')
const { validateProjectName } = await import('../utils/validation.js')
const { createProject } = await import('../generators/project.js')
const { createCommand } = await import('./create')

const mockInquirer = inquirer.default as any
const mockLogger = logger as any
const mockValidateProjectName = validateProjectName as any
const mockCreateProject = createProject as any

// Set up mock functions
mockInquirer.prompt = vi.fn()
mockValidateProjectName.mockReturnValue({ valid: true })
mockCreateProject.mockResolvedValue(undefined)

describe('create Command', () => {
  let _mockProcessExit: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock process.cwd
    vi.spyOn(process, 'cwd').mockReturnValue('/current/directory')

    // Store the process.exit mock for individual test control - don't throw by default
    _mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      return undefined as never
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('command Configuration', () => {
    it('should be configured with correct description and options', () => {
      expect(createCommand.description()).toBe('Create a new G1 API project')

      // Check that the command has the expected options
      const options = createCommand.options
      const optionNames = options.map(opt => opt.long)

      expect(optionNames).toContain('--template')
      expect(optionNames).toContain('--directory')
      expect(optionNames).toContain('--no-git')
      expect(optionNames).toContain('--no-install')
      expect(optionNames).toContain('--package-manager')
      expect(optionNames).toContain('--typescript')
      expect(optionNames).toContain('--no-eslint')
      expect(optionNames).toContain('--no-prettier')
    })
  })

  describe('project Name Validation', () => {
    it('should validate project name when provided', async () => {
      mockValidateProjectName.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({ confirm: true })
      mockCreateProject.mockResolvedValue(undefined)

      // Simulate the action function from createCommand
      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', {
        template: 'api',
        packageManager: 'bun',
        git: true,
        install: true,
        typescript: true,
        eslint: true,
        prettier: true,
      })

      expect(mockValidateProjectName).toHaveBeenCalledWith('test-project')
    })

    it('should exit if project name is invalid', async () => {
      // Configure process.exit to throw for this specific test
      mockProcessExit.mockImplementation(() => {
        throw new Error('process.exit called')
      })

      mockValidateProjectName.mockReturnValue({
        valid: false,
        message: 'Invalid project name',
      })
      mockLogger.error = vi.fn()

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await expect(actionFn('invalid-name', {})).rejects.toThrow('process.exit called')

      expect(mockLogger.error).toHaveBeenCalledWith('Invalid project name')
    })

    it('should prompt for project name if not provided', async () => {
      mockInquirer.prompt.mockResolvedValue({ name: 'prompted-project' })
      mockValidateProjectName.mockReturnValue({ valid: true })
      mockCreateProject.mockResolvedValue(undefined)

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn(undefined, {
        template: 'api',
        packageManager: 'bun',
      })

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'input',
          name: 'name',
          message: 'What is your project name?',
          validate: expect.any(Function),
        },
      ])
    })
  })

  describe('interactive Prompts', () => {
    beforeEach(() => {
      mockValidateProjectName.mockReturnValue({ valid: true })
      mockCreateProject.mockResolvedValue(undefined)
    })

    it('should prompt for template if not provided', async () => {
      mockInquirer.prompt.mockResolvedValue({
        template: 'minimal',
        packageManager: 'npm',
      })

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', {})

      const promptCalls = mockInquirer.prompt.mock.calls
      const templatePrompt = promptCalls.find((call: any) =>
        call[0].some((prompt: any) => prompt.name === 'template')
      )

      expect(templatePrompt).toBeDefined()
    })

    it('should prompt for package manager if not provided', async () => {
      mockInquirer.prompt.mockResolvedValue({
        packageManager: 'yarn',
      })

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', { template: 'api' })

      const promptCalls = mockInquirer.prompt.mock.calls
      const packageManagerPrompt = promptCalls.find(call =>
        call[0].some((prompt: any) => prompt.name === 'packageManager')
      )

      expect(packageManagerPrompt).toBeDefined()
    })

    it('should not prompt if all options are provided', async () => {
      mockInquirer.prompt.mockResolvedValue({ confirm: true })

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', {
        template: 'minimal', // Use 'minimal' instead of 'api' to avoid template prompt
        packageManager: 'bun',
        directory: '/custom/dir',
        git: true,
        install: true,
        typescript: true,
        eslint: true,
        prettier: true,
      })

      // Should be called twice: once for empty prompts array, once for confirmation
      expect(mockInquirer.prompt).toHaveBeenCalledTimes(2)
      expect(mockInquirer.prompt).toHaveBeenNthCalledWith(1, [])
      expect(mockInquirer.prompt).toHaveBeenNthCalledWith(2, [
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Proceed with project creation?',
          default: true,
        },
      ])
    })
  })

  describe('project Creation', () => {
    beforeEach(() => {
      mockValidateProjectName.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({})
      mockLogger.subheader = vi.fn()
      mockLogger.listItem = vi.fn()
      mockLogger.newLine = vi.fn()
    })

    it('should create project with correct options', async () => {
      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', {
        template: 'api',
        directory: '/custom/dir',
        packageManager: 'npm',
        git: false,
        install: false,
        typescript: true,
        eslint: false,
        prettier: false,
      })

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: 'test-project',
        template: 'api',
        directory: '/custom/dir',
        packageManager: 'npm',
        git: false,
        install: false,
        typescript: true,
        eslint: false,
        prettier: false,
      })
    })

    it('should use default directory if not provided', async () => {
      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', {
        template: 'api',
        packageManager: 'bun',
      })

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: '/current/directory',
        })
      )
    })

    it('should merge prompted answers with provided options', async () => {
      mockInquirer.prompt.mockResolvedValue({
        template: 'minimal',
        packageManager: 'yarn',
      })

      const actionFn = mockActionHandler || createCommand._actionHandler

      await actionFn('test-project', {
        git: false,
        typescript: false,
      })

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: 'test-project',
        template: 'minimal',
        directory: '/current/directory',
        packageManager: 'yarn',
        git: false,
        install: undefined,
        typescript: false,
        eslint: undefined,
        prettier: undefined,
      })
    })

    it('should display configuration summary', async () => {
      // Mock inquirer to return confirmation
      mockInquirer.prompt.mockResolvedValue({ confirm: true })

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', {
        template: 'api',
        packageManager: 'bun',
        directory: '/test/dir',
      })

      expect(mockLogger.subheader).toHaveBeenCalledWith('📋 Project Configuration')
      expect(mockLogger.table).toHaveBeenCalledWith([
        { key: 'Project Name', value: 'test-project' },
        { key: 'Template', value: 'api' },
        { key: 'Directory', value: '/test/dir/test-project' },
        { key: 'Package Manager', value: 'bun' },
        { key: 'TypeScript', value: 'No' },
        { key: 'ESLint', value: 'No' },
        { key: 'Prettier', value: 'No' },
        { key: 'Git Init', value: 'No' },
        { key: 'Install Dependencies', value: 'No' },
      ])
    })

    it('should handle project creation errors', async () => {
      // Ensure validation passes first
      mockValidateProjectName.mockReturnValue({ valid: true })
      mockCreateProject.mockRejectedValue(new Error('Creation failed'))

      // Mock inquirer to skip prompts
      mockInquirer.prompt.mockResolvedValue({ confirm: true })

      // Make process.exit throw for this test
      _mockProcessExit.mockImplementation(() => {
        throw new Error('Process exit called')
      })

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await expect(
        actionFn('test-project', {
          template: 'api',
          packageManager: 'bun',
        })
      ).rejects.toThrow('process.exit called')

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to create project: Creation failed')
    })
  })

  describe('template Choices', () => {
    it('should provide correct template choices', async () => {
      mockValidateProjectName.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({ template: 'api' })
      mockCreateProject.mockResolvedValue(undefined)

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', {})

      const promptCall = mockInquirer.prompt.mock.calls.find((call: any) =>
        call[0].some((prompt: any) => prompt.name === 'template')
      )

      if (promptCall) {
        const templatePrompt = promptCall[0].find((prompt: any) => prompt.name === 'template')
        expect(templatePrompt.choices).toEqual([
          {
            name: 'API Server - Full-featured API with auth, database, and middleware',
            value: 'api',
          },
          { name: 'Minimal API - Basic API structure with minimal dependencies', value: 'minimal' },
          { name: 'Plugin - Create a G1 framework plugin', value: 'plugin' },
        ])
      }
    })
  })

  describe('package Manager Choices', () => {
    it('should provide correct package manager choices', async () => {
      mockValidateProjectName.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({
        template: 'api',
        directory: './test-project',
        packageManager: 'bun',
        git: true,
        install: true,
        eslint: true,
        prettier: true,
      })
      mockCreateProject.mockResolvedValue(undefined)

      const actionFn = mockActionHandler || (createCommand as any)._actionHandler

      await actionFn('test-project', { template: 'api' })

      const promptCall = mockInquirer.prompt.mock.calls.find((call: any) =>
        call[0].some((prompt: any) => prompt.name === 'packageManager')
      )

      if (promptCall) {
        const packageManagerPrompt = promptCall[0].find(
          (prompt: any) => prompt.name === 'packageManager'
        )
        expect(packageManagerPrompt.choices).toEqual([
          { name: 'Bun (recommended)', value: 'bun' },
          { name: 'npm', value: 'npm' },
          { name: 'yarn', value: 'yarn' },
          { name: 'pnpm', value: 'pnpm' },
        ])
      }
    })
  })
})
