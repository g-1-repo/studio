import path from 'node:path'
import fs from 'fs-extra'
import Mustache from 'mustache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  copyTemplateFiles,
  createTemplateVariables,
  getAvailableTemplates,
  renderTemplate,
  renderTemplateFile,
  renderTemplateToFile,
  transformFileName,
  validateTemplatePath,
} from './template'

// Mock Mustache
vi.mock('mustache', () => ({
  default: {
    render: vi.fn(),
  },
}))

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    pathExists: vi.fn(),
    ensureDir: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    copy: vi.fn(),
  },
}))

// Mock path
vi.mock('path', () => ({
  default: {
    join: vi.fn(),
    resolve: vi.fn(),
    dirname: vi.fn(),
    basename: vi.fn(),
    extname: vi.fn(),
    relative: vi.fn(),
    normalize: vi.fn(),
    sep: '/',
    posix: {
      normalize: vi.fn(),
    },
  },
  join: vi.fn(),
  resolve: vi.fn(),
  dirname: vi.fn(),
  basename: vi.fn(),
  extname: vi.fn(),
  relative: vi.fn(),
  normalize: vi.fn(),
  sep: '/',
  posix: {
    normalize: vi.fn(),
  },
}))

const mockMustache = Mustache as any
const mockFs = fs as any
const mockPath = path as any

describe('template Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('renderTemplate', () => {
    it('should render template with variables', () => {
      const template = 'Hello {{name}}!'
      const variables = { name: 'World' }
      const expected = 'Hello World!'

      mockMustache.render.mockReturnValue(expected)

      const result = renderTemplate(template, variables)

      expect(result).toBe(expected)
      expect(mockMustache.render).toHaveBeenCalledWith(template, variables)
    })

    it('should handle empty template', () => {
      const template = ''
      const variables = {}
      const expected = ''

      mockMustache.render.mockReturnValue(expected)

      const result = renderTemplate(template, variables)

      expect(result).toBe(expected)
    })

    it('should handle complex variables', () => {
      const template = '{{#items}}{{name}}: {{value}}{{/items}}'
      const variables = {
        items: [
          { name: 'item1', value: 'value1' },
          { name: 'item2', value: 'value2' },
        ],
      }
      const expected = 'item1: value1item2: value2'

      mockMustache.render.mockReturnValue(expected)

      const result = renderTemplate(template, variables)

      expect(result).toBe(expected)
      expect(mockMustache.render).toHaveBeenCalledWith(template, variables)
    })
  })

  describe('renderTemplateFile', () => {
    it('should read and render template file', async () => {
      const templatePath = '/templates/test.mustache'
      const templateContent = 'Hello {{name}}!'
      const variables = { name: 'World' }
      const expected = 'Hello World!'

      mockFs.readFile.mockResolvedValue(templateContent)
      mockMustache.render.mockReturnValue(expected)

      const result = await renderTemplateFile(templatePath, variables)

      expect(result).toBe(expected)
      expect(mockFs.readFile).toHaveBeenCalledWith(templatePath, 'utf-8')
      expect(mockMustache.render).toHaveBeenCalledWith(templateContent, variables)
    })

    it('should throw error if file cannot be read', async () => {
      const templatePath = '/templates/nonexistent.mustache'
      const variables = {}

      mockFs.readFile.mockRejectedValue(new Error('File not found'))

      await expect(renderTemplateFile(templatePath, variables)).rejects.toThrow('File not found')
    })
  })

  describe('renderTemplateToFile', () => {
    it('should render template and write to file', async () => {
      const template = 'Hello {{name}}!'
      const outputPath = '/output/test.txt'
      const variables = { name: 'World' }
      const rendered = 'Hello World!'

      mockFs.pathExists.mockResolvedValue(false)
      mockFs.ensureDir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockMustache.render.mockReturnValue(rendered)
      mockPath.dirname.mockReturnValue('/output')

      await renderTemplateToFile(template, outputPath, variables)

      expect(mockFs.pathExists).toHaveBeenCalledWith(outputPath)
      expect(mockFs.ensureDir).toHaveBeenCalledWith('/output')
      expect(mockMustache.render).toHaveBeenCalledWith(template, variables)
      expect(mockFs.writeFile).toHaveBeenCalledWith(outputPath, rendered, 'utf-8')
    })

    it('should throw error if file exists and overwrite is false', async () => {
      const template = 'Hello {{name}}!'
      const outputPath = '/output/existing.txt'
      const variables = { name: 'World' }

      mockFs.pathExists.mockResolvedValue(true)

      await expect(renderTemplateToFile(template, outputPath, variables)).rejects.toThrow(
        'File already exists: /output/existing.txt'
      )
    })

    it('should overwrite file when overwrite option is true', async () => {
      const template = 'Hello {{name}}!'
      const outputPath = '/output/existing.txt'
      const variables = { name: 'World' }
      const rendered = 'Hello World!'

      mockFs.pathExists.mockResolvedValue(true)
      mockFs.ensureDir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockMustache.render.mockReturnValue(rendered)
      mockPath.dirname.mockReturnValue('/output')

      await renderTemplateToFile(template, outputPath, variables, { overwrite: true })

      expect(mockFs.writeFile).toHaveBeenCalledWith(outputPath, rendered, 'utf-8')
    })
  })

  describe('copyTemplateFiles', () => {
    it('should copy and render template files', async () => {
      const templateDir = '/templates'
      const destinationDir = '/output'
      const variables = { name: 'test' }

      const mockEntries = [
        { name: 'file1.mustache', isDirectory: () => false },
        { name: 'file2.txt', isDirectory: () => false },
        { name: 'subdir', isDirectory: () => true },
      ]

      mockFs.ensureDir.mockResolvedValue(undefined)
      mockFs.readdir.mockResolvedValue(mockEntries)
      mockFs.readFile.mockResolvedValue('Template content {{name}}')
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.pathExists.mockResolvedValue(false)
      mockFs.stat.mockImplementation((path: string) => {
        if (path === templateDir) {
          return Promise.resolve({ isDirectory: () => true })
        }
        return Promise.resolve({ isDirectory: () => false })
      })
      mockPath.join.mockImplementation((...args: string[]) => args.join('/'))
      mockMustache.render.mockReturnValue('Template content test')
      mockPath.extname.mockImplementation(p => (p.endsWith('.mustache') ? '.mustache' : '.txt'))

      await copyTemplateFiles(templateDir, destinationDir, variables)

      expect(mockFs.ensureDir).toHaveBeenCalledWith(destinationDir)
    })

    it('should apply filter when provided', async () => {
      const templateDir = '/templates'
      const destinationDir = '/output'
      const variables = { name: 'test' }

      // Test that filter is called and respected
      const filter = vi.fn((src: string) => src.endsWith('.mustache'))

      mockFs.ensureDir.mockResolvedValue(undefined)
      mockFs.pathExists.mockResolvedValue(false)
      mockFs.stat.mockImplementation((path: string) => {
        if (path === templateDir) {
          return Promise.resolve({ isDirectory: () => true })
        }
        return Promise.resolve({ isDirectory: () => false })
      })
      mockFs.readdir.mockResolvedValue(['file1.mustache', 'file2.txt'])
      mockPath.join.mockImplementation((...args: string[]) => args.join('/'))

      await copyTemplateFiles(templateDir, destinationDir, variables, { filter })

      // Verify filter was called with the template directory first
      expect(filter).toHaveBeenCalled()
      expect(filter).toHaveBeenCalledWith('/templates', '/output')
    })
  })

  describe('getAvailableTemplates', () => {
    it('should return list of available templates', async () => {
      const templatesDir = '/templates'
      const mockEntries = [
        { name: 'template1', isDirectory: () => true },
        { name: 'template2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false },
      ]

      mockFs.readdir.mockResolvedValue(mockEntries)

      const result = await getAvailableTemplates(templatesDir)

      expect(result).toEqual(['template1', 'template2'])
      expect(mockFs.readdir).toHaveBeenCalledWith(templatesDir, { withFileTypes: true })
    })

    it('should return empty array if directory does not exist', async () => {
      const templatesDir = '/nonexistent'

      mockFs.readdir.mockRejectedValue(new Error('Directory not found'))

      const result = await getAvailableTemplates(templatesDir)

      expect(result).toEqual([])
    })
  })

  describe('validateTemplatePath', () => {
    it('should return valid for existing template directory', async () => {
      const templatePath = '/templates/valid-template'

      mockFs.pathExists.mockResolvedValue(true)
      mockFs.stat.mockResolvedValue({ isDirectory: () => true })

      const result = await validateTemplatePath(templatePath)

      expect(result).toEqual({
        valid: true,
        message: 'Valid template',
      })
    })

    it('should return invalid for non-existent path', async () => {
      const templatePath = '/templates/nonexistent'

      mockFs.stat.mockRejectedValue(new Error('ENOENT: no such file or directory'))

      const result = await validateTemplatePath(templatePath)

      expect(result).toEqual({
        valid: false,
        message: 'Cannot access template: ENOENT: no such file or directory',
      })
    })

    it('should return invalid for file instead of directory', async () => {
      const templatePath = '/templates/file.txt'

      mockFs.pathExists.mockResolvedValue(true)
      mockFs.stat.mockResolvedValue({ isDirectory: () => false })

      const result = await validateTemplatePath(templatePath)

      expect(result).toEqual({
        valid: false,
        message: 'Template path is not a directory',
      })
    })

    it('should handle stat errors', async () => {
      const templatePath = '/templates/error'

      mockFs.pathExists.mockResolvedValue(true)
      mockFs.stat.mockRejectedValue(new Error('Permission denied'))

      const result = await validateTemplatePath(templatePath)

      expect(result).toEqual({
        valid: false,
        message: 'Cannot access template: Permission denied',
      })
    })
  })

  describe('transformFileName', () => {
    it('should transform filename with variables', () => {
      const fileName = '__projectName__.js'
      const variables = { projectName: 'my-project' }

      mockMustache.render.mockReturnValue('my-project.js')

      const result = transformFileName(fileName, variables)

      expect(result).toBe('my-project.js')
      expect(mockMustache.render).toHaveBeenCalledWith(fileName, variables)
    })

    it('should return original filename if no variables', () => {
      const fileName = 'static-file.js'
      const variables = {}

      mockMustache.render.mockReturnValue('static-file.js')

      const result = transformFileName(fileName, variables)

      expect(result).toBe('static-file.js')
    })
  })

  describe('createTemplateVariables', () => {
    it('should create template variables with all transformations', () => {
      const options = {
        projectName: 'my-awesome-project',
        description: 'A test project',
        author: 'John Doe',
        license: 'MIT',
        customField: 'custom value',
      }

      const result = createTemplateVariables(options)

      expect(result).toEqual({
        projectName: 'my-awesome-project',
        packageName: 'my-awesome-project',
        description: 'A test project',
        author: 'John Doe',
        license: 'MIT',
        projectNameCamelCase: 'myAwesomeProject',
        projectNamePascalCase: 'MyAwesomeProject',
        projectNameKebabCase: 'my-awesome-project',
        projectNameSnakeCase: 'my_awesome_project',
        name: 'my-awesome-project',
        camelName: 'myAwesomeProject',
        pascalName: 'MyAwesomeProject',
        kebabName: 'my-awesome-project',
        snakeName: 'my_awesome_project',
        customField: 'custom value',
      })
    })

    it('should handle minimal options', () => {
      const options = {
        projectName: 'simple',
      }

      const result = createTemplateVariables(options)

      expect(result).toEqual({
        projectName: 'simple',
        packageName: 'simple',
        description: 'A new project',
        author: 'Your Name',
        license: 'MIT',
        projectNameCamelCase: 'simple',
        projectNamePascalCase: 'Simple',
        projectNameKebabCase: 'simple',
        projectNameSnakeCase: 'simple',
        name: 'simple',
        camelName: 'simple',
        pascalName: 'Simple',
        kebabName: 'simple',
        snakeName: 'simple',
      })
    })

    it('should handle project names with special characters', () => {
      const options = {
        projectName: '@scope/my-package_name',
      }

      const result = createTemplateVariables(options)

      expect(result.projectNameCamelCase).toBe('scopeMyPackageName')
      expect(result.projectNamePascalCase).toBe('ScopeMyPackageName')
      expect(result.projectNameKebabCase).toBe('scopemy-package-name')
      expect(result.projectNameSnakeCase).toBe('scopemy_package_name')
    })
  })
})
