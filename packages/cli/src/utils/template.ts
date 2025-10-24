import path from 'node:path'
import fs from 'fs-extra'
import Mustache from 'mustache'
import type { TemplateVariables } from '../types/index.js'

/**
 * Render a template string with variables
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  return Mustache.render(template, variables)
}

/**
 * Render a template file with variables
 */
export async function renderTemplateFile(
  templatePath: string,
  variables: TemplateVariables
): Promise<string> {
  const template = await fs.readFile(templatePath, 'utf-8')
  return renderTemplate(template, variables)
}

/**
 * Render template and write to file
 */
export async function renderTemplateToFile(
  template: string,
  outputPath: string,
  variables: TemplateVariables,
  options: { overwrite?: boolean } = {}
): Promise<void> {
  const { overwrite = false } = options

  // Check if file exists and overwrite is not allowed
  if (!overwrite && (await fs.pathExists(outputPath))) {
    throw new Error(`File already exists: ${outputPath}`)
  }

  // Ensure directory exists
  await fs.ensureDir(path.dirname(outputPath))

  // Render and write template
  const rendered = renderTemplate(template, variables)
  await fs.writeFile(outputPath, rendered, 'utf-8')
}

/**
 * Copy and render template files to destination
 */
export async function copyTemplateFiles(
  templateDir: string,
  destinationDir: string,
  variables: TemplateVariables,
  options: {
    overwrite?: boolean
    filter?: (src: string, dest: string) => boolean
  } = {}
): Promise<void> {
  const { overwrite = false, filter } = options

  await fs.ensureDir(destinationDir)

  const copyFile = async (src: string, dest: string): Promise<void> => {
    // Apply filter if provided
    if (filter && !filter(src, dest)) {
      return
    }

    // Check if destination exists and overwrite is disabled
    if (!overwrite && (await fs.pathExists(dest))) {
      return
    }

    const stats = await fs.stat(src)

    if (stats.isDirectory()) {
      await fs.ensureDir(dest)
      const files = await fs.readdir(src)

      for (const file of files) {
        await copyFile(path.join(src, file), path.join(dest, file))
      }
    } else {
      const content = await fs.readFile(src, 'utf-8')

      // Check if file should be templated (has .mustache extension or contains mustache syntax)
      const shouldTemplate = src.endsWith('.mustache') || content.includes('{{')

      if (shouldTemplate) {
        const rendered = renderTemplate(content, variables)
        await fs.writeFile(dest.replace('.mustache', ''), rendered)
      } else {
        await fs.copy(src, dest)
      }
    }
  }

  await copyFile(templateDir, destinationDir)
}

/**
 * Get available templates from templates directory
 */
export async function getAvailableTemplates(templatesDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(templatesDir, { withFileTypes: true })
    return entries.filter(entry => entry.isDirectory()).map(entry => entry.name)
  } catch {
    return []
  }
}

/**
 * Validate template directory structure
 */
export async function validateTemplatePath(templatePath: string): Promise<{
  valid: boolean
  message: string
}> {
  try {
    const stats = await fs.stat(templatePath)

    if (!stats.isDirectory()) {
      return {
        valid: false,
        message: 'Template path is not a directory',
      }
    }

    // Check for required files
    const requiredFiles = ['package.json']

    for (const file of requiredFiles) {
      const filePath = path.join(templatePath, file)

      if (!(await fs.pathExists(filePath))) {
        return {
          valid: false,
          message: `Template missing required file: ${file}`,
        }
      }
    }

    return {
      valid: true,
      message: 'Valid template',
    }
  } catch (error) {
    return {
      valid: false,
      message: `Cannot access template: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Transform file name with template variables
 */
export function transformFileName(fileName: string, variables: TemplateVariables): string {
  return renderTemplate(fileName, variables)
}

/**
 * Create template variables from project options
 */
export function createTemplateVariables(options: {
  projectName: string
  description?: string
  author?: string
  license?: string
  [key: string]: unknown
}): TemplateVariables {
  const {
    projectName,
    description = `A new project`,
    author = 'Your Name',
    license = 'MIT',
    ...rest
  } = options

  return {
    projectName,
    packageName: projectName,
    description,
    author,
    license,
    // Derived variables
    projectNameCamelCase: toCamelCase(projectName),
    projectNamePascalCase: toPascalCase(projectName),
    projectNameKebabCase: toKebabCase(projectName),
    projectNameSnakeCase: toSnakeCase(projectName),
    // Generator-specific variables
    name: projectName,
    camelName: toCamelCase(projectName),
    pascalName: toPascalCase(projectName),
    kebabName: toKebabCase(projectName),
    snakeName: toSnakeCase(projectName),
    ...rest,
  }
}

/**
 * Convert string to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .replace(/[@/\-_\s]+/g, ' ') // Replace special chars with spaces
    .trim()
    .split(' ')
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join('')
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[@/\-_\s]+/g, ' ') // Replace special chars with spaces
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

/**
 * Convert string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/[@/]/g, '') // Remove @ and / characters
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Convert string to snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/[@/]/g, '') // Remove @ and / characters
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}
