import fs from 'fs-extra'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  validateDirectory,
  validateGeneratorType,
  validateIdentifier,
  validatePackageManager,
  validateProjectName,
  validateTemplate,
} from './validation'

// Mock fs-extra
vi.mock('fs-extra')
const mockFs = vi.mocked(fs)

describe('cLI Validation Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validateProjectName', () => {
    it('should validate correct project names', () => {
      const validNames = [
        'my-project',
        'my_project',
        'myproject',
        'my-awesome-api',
        'project123',
      ]

      validNames.forEach((name) => {
        const result = validateProjectName(name)
        expect(result.valid).toBe(true)
        expect(result.message).toBe('')
      })
    })

    it('should reject empty or whitespace-only names', () => {
      const invalidNames = ['', '   ', '\t', '\n']

      invalidNames.forEach((name) => {
        const result = validateProjectName(name)
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Project name cannot be empty')
      })
    })

    it('should reject names starting with . or _', () => {
      const invalidNames = ['.project', '_project', '.hidden-project']

      invalidNames.forEach((name) => {
        const result = validateProjectName(name)
        expect(result.valid).toBe(false)
        expect(result.message).toContain('name cannot start with')
      })
    })

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(215)
      const result = validateProjectName(longName)

      expect(result.valid).toBe(false)
      expect(result.message).toContain('name can no longer contain more than 214 characters')
    })

    it('should reject reserved names', () => {
      const reservedNames = ['node_modules', 'favicon.ico']

      reservedNames.forEach((name) => {
        const result = validateProjectName(name)
        expect(result.valid).toBe(false)
        expect(result.message).toContain('blacklisted')
      })
    })

    it('should reject names with invalid characters', () => {
      const invalidNames = ['my project', 'my@project', 'my#project', 'MY-PROJECT']

      invalidNames.forEach((name) => {
        const result = validateProjectName(name)
        expect(result.valid).toBe(false)
        expect(result.message).toContain('Invalid project name')
      })
    })
  })

  describe('validateDirectory', () => {
    it('should validate when directory does not exist', () => {
      // Mock parent directory to exist, target directory to not exist
      mockFs.existsSync.mockImplementation((path: string) => {
        if (path === '/path/to/new')
          return true // parent exists
        if (path === '/path/to/new/project')
          return false // target doesn't exist
        return false
      })

      const result = validateDirectory('/path/to/new/project')

      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    it('should validate when directory exists but is empty', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any)
      mockFs.readdirSync.mockReturnValue([])

      const result = validateDirectory('/path/to/empty/project')

      expect(result.valid).toBe(true)
      expect(result.message).toBe('')
    })

    it('should reject when directory exists and is not empty', () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.statSync.mockReturnValue({
        isDirectory: () => true,
      } as any)
      mockFs.readdirSync.mockReturnValue(['file1.txt', 'folder1'] as any)

      const result = validateDirectory('/path/to/existing/project')

      expect(result.valid).toBe(false)
      expect(result.message).toBe('Directory already exists and is not empty')
    })

    it('should handle file system errors gracefully', () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })

      const result = validateDirectory('/path/to/project')

      expect(result.valid).toBe(false)
      expect(result.message).toContain('Error checking directory')
    })
  })

  describe('validateTemplate', () => {
    const availableTemplates = ['api', 'minimal', 'full-stack', 'microservice']

    it('should validate existing templates', () => {
      availableTemplates.forEach((template) => {
        const result = validateTemplate(template, availableTemplates)
        expect(result.valid).toBe(true)
        expect(result.message).toBe('')
      })
    })

    it('should reject non-existent templates', () => {
      const invalidTemplates = ['invalid', 'nonexistent', 'custom']

      invalidTemplates.forEach((template) => {
        const result = validateTemplate(template, availableTemplates)
        expect(result.valid).toBe(false)
        expect(result.message).toContain('Invalid template')
        expect(result.message).toContain(availableTemplates.join(', '))
      })
    })

    it('should handle empty template list', () => {
      const result = validateTemplate('api', [])

      expect(result.valid).toBe(false)
      expect(result.message).toContain('Invalid template')
    })
  })

  describe('validatePackageManager', () => {
    it('should validate supported package managers', () => {
      const validManagers = ['npm', 'yarn', 'pnpm', 'bun']

      validManagers.forEach((pm) => {
        const result = validatePackageManager(pm)
        expect(result.valid).toBe(true)
        expect(result.message).toBe('')
      })
    })

    it('should reject unsupported package managers', () => {
      const invalidManagers = ['pip', 'composer', 'cargo', 'invalid']

      invalidManagers.forEach((pm) => {
        const result = validatePackageManager(pm)
        expect(result.valid).toBe(false)
        expect(result.message).toContain('Invalid package manager')
        expect(result.message).toContain('npm, yarn, pnpm, bun')
      })
    })
  })

  describe('validateGeneratorType', () => {
    it('should validate supported generator types', () => {
      const validTypes = ['route', 'middleware', 'plugin', 'model', 'service']

      validTypes.forEach((type) => {
        const result = validateGeneratorType(type)
        expect(result.valid).toBe(true)
        expect(result.message).toBe('')
      })
    })

    it('should reject unsupported generator types', () => {
      const invalidTypes = ['component', 'page', 'invalid', 'custom']

      invalidTypes.forEach((type) => {
        const result = validateGeneratorType(type)
        expect(result.valid).toBe(false)
        expect(result.message).toContain('Invalid generator type')
        expect(result.message).toContain('route, middleware, plugin, model, service')
      })
    })
  })

  describe('validateIdentifier', () => {
    it('should validate correct identifiers', () => {
      const validIdentifiers = [
        'myFunction',
        'MyClass',
        'my_variable',
        'CONSTANT_VALUE',
        'func123',
        '_private',
        '$special',
      ]

      validIdentifiers.forEach((identifier) => {
        const result = validateIdentifier(identifier)
        expect(result.valid).toBe(true)
        expect(result.message).toBe('')
      })
    })

    it('should reject empty identifiers', () => {
      const result = validateIdentifier('')

      expect(result.valid).toBe(false)
      expect(result.message).toBe('Identifier cannot be empty')
    })

    it('should reject identifiers starting with numbers', () => {
      const invalidIdentifiers = ['123func', '9variable', '0class']

      invalidIdentifiers.forEach((identifier) => {
        const result = validateIdentifier(identifier)
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Identifier cannot start with a number')
      })
    })

    it('should reject identifiers with invalid characters', () => {
      const invalidIdentifiers = [
        'my-function',
        'my function',
        'my@function',
        'my#function',
        'my.function',
      ]

      invalidIdentifiers.forEach((identifier) => {
        const result = validateIdentifier(identifier)
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Identifier can only contain letters, numbers, underscore, and dollar sign')
      })
    })

    it('should reject JavaScript reserved words', () => {
      const reservedWords = [
        'function',
        'class',
        'const',
        'let',
        'var',
        'if',
        'else',
        'for',
        'while',
        'return',
        'import',
        'export',
        'default',
      ]

      reservedWords.forEach((word) => {
        const result = validateIdentifier(word)
        expect(result.valid).toBe(false)
        expect(result.message).toBe('Identifier cannot be a JavaScript reserved word')
      })
    })

    it('should handle case sensitivity for reserved words', () => {
      const result1 = validateIdentifier('Function')
      const result2 = validateIdentifier('CLASS')

      expect(result1.valid).toBe(true) // Different case should be valid
      expect(result2.valid).toBe(true)
    })
  })
})
