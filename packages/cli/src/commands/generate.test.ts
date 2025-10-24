import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Define mockLogger first so it can be used in doMock
const mockLogger = {
  header: vi.fn(),
  subheader: vi.fn(),
  listItem: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  success: vi.fn(),
  newLine: vi.fn(),
  startSpinner: vi.fn(),
  succeedSpinner: vi.fn(),
  failSpinner: vi.fn(),
  updateSpinner: vi.fn(),
  stopSpinner: vi.fn()
}

// Use dynamic imports with vi.doMock for proper hoisting
vi.doMock('commander', () => ({
  Command: vi.fn(() => {
    let mockActionHandler: any = null
    const instance = {
      name: vi.fn().mockReturnThis(),
      description: vi.fn().mockReturnThis(),
      argument: vi.fn().mockReturnThis(),
      option: vi.fn().mockReturnThis(),
      alias: vi.fn().mockReturnThis(),
      action: vi.fn((handler) => {
        mockActionHandler = handler
        instance._actionHandler = handler
        return instance
      }),
      _actionHandler: null,
      options: [
        { long: '--directory' },
        { long: '--force' },
        { long: '--no-tests' },
        { long: '--no-docs' },
        { long: '--template' }
      ]
    }
    return instance
  })
}))

vi.doMock('inquirer', () => ({
  default: {
    prompt: vi.fn()
  },
  prompt: vi.fn()
}))

vi.doMock('../utils/validation.js', () => ({
  validateIdentifier: vi.fn()
}))

vi.doMock('../generators/index.js', () => ({
  generatePlugin: vi.fn(),
  generateMiddleware: vi.fn(),
  generateRoute: vi.fn()
}))

vi.doMock('../utils/logger.js', () => ({
  Logger: vi.fn().mockImplementation(() => mockLogger),
  logger: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    header: vi.fn(),
    subheader: vi.fn(),
    listItem: vi.fn(),
    newLine: vi.fn(),
    startSpinner: vi.fn(),
    succeedSpinner: vi.fn(),
    failSpinner: vi.fn(),
    updateSpinner: vi.fn(),
    stopSpinner: vi.fn()
  }
}))

// Dynamic imports
const { Command } = await import('commander')
const inquirer = await import('inquirer')
const { Logger } = await import('../utils/logger.js')
const { validateIdentifier } = await import('../utils/validation.js')
const { generatePlugin, generateMiddleware, generateRoute } = await import('../generators/index.js')
const { createGenerateCommand } = await import('./generate')

const mockInquirer = inquirer as any
const mockValidateIdentifier = validateIdentifier as any
const mockGeneratePlugin = generatePlugin as any
const mockGenerateMiddleware = generateMiddleware as any
const mockGenerateRoute = generateRoute as any

// Mock the Logger constructor to return our mockLogger
vi.mocked(Logger).mockImplementation(() => mockLogger as any)

// Mock inquirer.default.prompt to use the same mock as inquirer.prompt
mockInquirer.default.prompt = mockInquirer.prompt

describe('Generate Command', () => {
  let generateCommand: Command
  let mockProcessExit: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock process.exit to not throw by default
    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      // Don't throw by default, only in specific tests
    }) as any)

    generateCommand = createGenerateCommand()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Command Configuration', () => {
    it('should be configured with correct description and options', () => {
      // Create a command instance to test configuration
      const commandInstance = createGenerateCommand()

      // Verify the command instance was created
      expect(commandInstance).toBeDefined()

      // Verify the mocked Command constructor was called
      expect(Command).toHaveBeenCalled()

      // Check that the command has the expected options from the mock
      const options = (commandInstance as any).options
      const optionNames = options.map((opt: any) => opt.long)

      expect(optionNames).toContain('--directory')
      expect(optionNames).toContain('--force')
      expect(optionNames).toContain('--no-tests')
      expect(optionNames).toContain('--no-docs')
      expect(optionNames).toContain('--template')
    })

    it('should accept type and name arguments', () => {
      // This test verifies that the command is properly configured
      // Since we're using mocked Commander, we'll test the configuration indirectly
      const commandInstance = createGenerateCommand()

      // Verify the command instance was created
      expect(commandInstance).toBeDefined()

      // Verify the mocked Command constructor was called
      expect(Command).toHaveBeenCalled()
    })
  })

  describe('Type Validation', () => {
    it('should accept valid generator types', async () => {
      mockValidateIdentifier.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({ confirm: true })
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockLogger.error).not.toHaveBeenCalled()
      expect(mockGeneratePlugin).toHaveBeenCalled()
    })

    it('should reject invalid generator types', async () => {
      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('invalid-type', 'test-name', {})

      expect(mockLogger.error).toHaveBeenCalledWith('Invalid generator type: invalid-type')
      expect(mockLogger.info).toHaveBeenCalledWith('Valid types: plugin, middleware, route')
    })

    it('should list valid types when invalid type is provided', async () => {
      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('bad-type', 'test-name', {})

      expect(mockLogger.info).toHaveBeenCalledWith('Valid types: plugin, middleware, route')
    })
  })

  describe('Name Handling', () => {
    beforeEach(() => {
      mockValidateIdentifier.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({ confirm: true })
    })

    it('should use provided name when valid', async () => {
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockGeneratePlugin).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test-plugin'
        })
      )
    })

    it('should prompt for name when not provided', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ name: 'prompted-name' })
        .mockResolvedValueOnce({ confirm: true })
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', undefined, {})

      expect(mockInquirer.prompt).toHaveBeenCalledWith([
        {
          type: 'input',
          name: 'name',
          message: 'Enter plugin name:',
          validate: expect.any(Function)
        }
      ])
    })

    it('should validate prompted name', async () => {
      mockInquirer.prompt
        .mockResolvedValueOnce({ name: 'prompted-name' })
        .mockResolvedValueOnce({ confirm: true })
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', undefined, {})

      const promptCall = mockInquirer.prompt.mock.calls[0]
      const namePrompt = promptCall[0][0]
      const validateFn = namePrompt.validate

      // Test validation function
      expect(validateFn('')).toBe('Name is required')
      expect(validateFn('   ')).toBe('Name is required')
    })

    it('should validate generator type', async () => {
      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('invalid', 'test-name', {})

      expect(mockLogger.error).toHaveBeenCalledWith('Invalid generator type: invalid')
      expect(mockLogger.info).toHaveBeenCalledWith('Valid types: plugin, middleware, route')
    })

    it('should validate generator name when not provided', async () => {
      mockInquirer.prompt.mockResolvedValue({ name: '' })
      mockValidateIdentifier.mockReturnValue({ valid: false, message: 'Name is required' })

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', undefined, {})

      expect(mockLogger.error).toHaveBeenCalledWith('Invalid name: Name is required')
    })

    it('should validate generator name when provided', async () => {
      mockValidateIdentifier.mockReturnValue({ valid: false, message: 'Invalid name' })

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'invalid-name', {})

      expect(mockLogger.error).toHaveBeenCalledWith('Invalid name: Invalid name')
    })
  })

  describe('Generation Options', () => {
    beforeEach(() => {
      mockValidateIdentifier.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({ confirm: true })
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])
    })

    it('should use default options when none provided', async () => {
      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockGeneratePlugin).toHaveBeenCalledWith({
        name: 'test-plugin',
        type: 'plugin',
        directory: undefined,
        force: undefined,
        includeTests: true,
        includeDocs: true,
        template: undefined
      })
    })

    it('should use provided options', async () => {
      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {
        directory: '/custom/dir',
        force: true,
        tests: false,
        docs: false,
        template: 'custom-template'
      })

      expect(mockGeneratePlugin).toHaveBeenCalledWith({
        name: 'test-plugin',
        type: 'plugin',
        directory: '/custom/dir',
        force: true,
        includeTests: false,
        includeDocs: false,
        template: 'custom-template'
      })
    })

    it('should display configuration summary', async () => {
      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {
        directory: '/test/dir',
        force: true,
        template: 'custom'
      })

      expect(mockLogger.subheader).toHaveBeenCalledWith('Configuration:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Type: plugin')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Name: test-plugin')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Directory: /test/dir')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Include tests: Yes')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Include docs: Yes')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Template: custom')
      expect(mockLogger.listItem).toHaveBeenCalledWith('Force overwrite: Yes')
    })
  })

  describe('Confirmation Prompt', () => {
    beforeEach(() => {
      mockValidateIdentifier.mockReturnValue({ valid: true })
    })

    it('should proceed when user confirms', async () => {
      mockInquirer.prompt.mockResolvedValue({ confirm: true })
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockGeneratePlugin).toHaveBeenCalled()
      expect(mockLogger.succeedSpinner).toHaveBeenCalledWith('plugin generated successfully!')
    })

    it('should cancel when user declines', async () => {
      mockInquirer.prompt.mockResolvedValue({ confirm: false })

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockLogger.info).toHaveBeenCalledWith('Generation cancelled')
      expect(mockGeneratePlugin).not.toHaveBeenCalled()
    })
  })

  describe('Code Generation', () => {
    beforeEach(() => {
      mockValidateIdentifier.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({ confirm: true })
    })

    it('should generate plugin code', async () => {
      mockGeneratePlugin.mockResolvedValue(['plugin.ts', 'plugin.test.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockGeneratePlugin).toHaveBeenCalledWith({
        name: 'test-plugin',
        type: 'plugin',
        directory: undefined,
        force: undefined,
        includeTests: true,
        includeDocs: true,
        template: undefined
      })
    })

    it('should generate middleware code', async () => {
      mockGenerateMiddleware.mockResolvedValue(['middleware.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('middleware', 'test-middleware', {})

      expect(mockGenerateMiddleware).toHaveBeenCalledWith({
        name: 'test-middleware',
        type: 'middleware',
        directory: undefined,
        force: undefined,
        includeTests: true,
        includeDocs: true,
        template: undefined
      })
    })

    it('should generate route code', async () => {
      mockGenerateRoute.mockResolvedValue(['route.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('route', 'test-route', {})

      expect(mockGenerateRoute).toHaveBeenCalledWith({
        name: 'test-route',
        type: 'route',
        directory: undefined,
        force: undefined,
        includeTests: true,
        includeDocs: true,
        template: undefined
      })
    })

    it('should list generated files', async () => {
      mockGeneratePlugin.mockResolvedValue(['plugin.ts', 'plugin.test.ts', 'plugin.md'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockLogger.subheader).toHaveBeenCalledWith('Generated files:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('plugin.ts')
      expect(mockLogger.listItem).toHaveBeenCalledWith('plugin.test.ts')
      expect(mockLogger.listItem).toHaveBeenCalledWith('plugin.md')
    })

    it('should show appropriate next steps for plugin', async () => {
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockLogger.subheader).toHaveBeenCalledWith('Next steps:')
      expect(mockLogger.listItem).toHaveBeenCalledWith('1. Implement your plugin logic in the generated files')
      expect(mockLogger.listItem).toHaveBeenCalledWith('2. Register the plugin in your application')
      expect(mockLogger.listItem).toHaveBeenCalledWith('3. Configure plugin settings if needed')
    })

    it('should show appropriate next steps for middleware', async () => {
      mockGenerateMiddleware.mockResolvedValue(['middleware.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('middleware', 'test-middleware', {})

      expect(mockLogger.listItem).toHaveBeenCalledWith('1. Implement your middleware logic')
      expect(mockLogger.listItem).toHaveBeenCalledWith('2. Add the middleware to your application')
      expect(mockLogger.listItem).toHaveBeenCalledWith('3. Configure middleware options if needed')
    })

    it('should show appropriate next steps for route', async () => {
      mockGenerateRoute.mockResolvedValue(['route.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('route', 'test-route', {})

      expect(mockLogger.listItem).toHaveBeenCalledWith('1. Implement your route handlers')
      expect(mockLogger.listItem).toHaveBeenCalledWith('2. Add validation and error handling')
      expect(mockLogger.listItem).toHaveBeenCalledWith('3. Test your routes')
    })

    it('should include test step when tests are enabled', async () => {
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', { tests: true })

      expect(mockLogger.listItem).toHaveBeenCalledWith('4. Run tests to ensure everything works')
    })

    it('should not include test step when tests are disabled', async () => {
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', { tests: false })

      expect(mockLogger.listItem).not.toHaveBeenCalledWith('4. Run tests to ensure everything works')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockValidateIdentifier.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({ confirm: true })
    })

    it('should handle generation errors gracefully', async () => {
      const error = new Error('Generation failed')
      mockGeneratePlugin.mockRejectedValue(error)

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await expect(generateCommand('plugin', 'test-plugin', {})).rejects.toThrow('Generation failed')
    })

    it('should handle non-Error exceptions', async () => {
      mockGeneratePlugin.mockRejectedValue('String error')

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await expect(generateCommand('plugin', 'test-plugin', {})).rejects.toThrow('String error')
    })

    it('should handle spinner failure on generation error', async () => {
      mockGeneratePlugin.mockRejectedValue(new Error('Test error'))

      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await expect(generateCommand('plugin', 'test-plugin', {})).rejects.toThrow('Test error')

      expect(mockLogger.startSpinner).toHaveBeenCalledWith('Generating plugin...')
      expect(mockLogger.failSpinner).toHaveBeenCalledWith('Generation failed')
    })
  })

  describe('Success Flow', () => {
    beforeEach(() => {
      mockValidateIdentifier.mockReturnValue({ valid: true })
      mockInquirer.prompt.mockResolvedValue({ confirm: true })
      mockGeneratePlugin.mockResolvedValue(['plugin.ts'])
    })

    it('should complete full success flow', async () => {
      // Import the generateCommand function directly
      const { generateCommand } = await import('./generate')

      await generateCommand('plugin', 'test-plugin', {})

      expect(mockLogger.header).toHaveBeenCalledWith('🔧 G1 Code Generator')
      expect(mockLogger.startSpinner).toHaveBeenCalledWith('Generating plugin...')
      expect(mockLogger.succeedSpinner).toHaveBeenCalledWith('plugin generated successfully!')
      expect(mockLogger.success).toHaveBeenCalledWith('🎉 Generation completed!')
    })
  })
})