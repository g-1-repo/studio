import path from 'node:path'
import validateNpmPackageName from 'validate-npm-package-name'
import fs from 'fs-extra'

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  message: string
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return {
      valid: false,
      message: 'Project name cannot be empty',
    }
  }

  const trimmedName = name.trim()

  // Check npm package name validity
  const npmValidation = validateNpmPackageName(trimmedName)
  if (!npmValidation.validForNewPackages) {
    const errors = npmValidation.errors || []
    const warnings = npmValidation.warnings || []
    const issues = [...errors, ...warnings]

    return {
      valid: false,
      message: `Invalid project name: ${issues.join(', ')}`,
    }
  }

  // Additional checks
  if (trimmedName.length > 214) {
    return {
      valid: false,
      message: 'Project name must be less than 214 characters',
    }
  }

  if (trimmedName.startsWith('.') || trimmedName.startsWith('_')) {
    return {
      valid: false,
      message: 'Project name cannot start with . or _',
    }
  }

  if (trimmedName !== trimmedName.toLowerCase()) {
    return {
      valid: false,
      message: 'Project name must be lowercase',
    }
  }

  // Check for reserved names
  const reservedNames = [
    'node_modules',
    'favicon.ico',
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'bun.lockb',
    '.git',
    '.gitignore',
    'readme',
    'changelog',
    'license',
    'dockerfile',
    'makefile',
  ]

  if (reservedNames.includes(trimmedName.toLowerCase())) {
    return {
      valid: false,
      message: `Project name "${trimmedName}" is reserved`,
    }
  }

  return {
    valid: true,
    message: '',
  }
}

/**
 * Validate directory path
 */
export function validateDirectory(dirPath: string): ValidationResult {
  if (!dirPath || dirPath.trim().length === 0) {
    return {
      valid: false,
      message: 'Directory path cannot be empty',
    }
  }

  const resolvedPath = path.resolve(dirPath.trim())

  try {
    // Check if parent directory exists and is writable
    const parentDir = path.dirname(resolvedPath)

    if (!fs.existsSync(parentDir)) {
      return {
        valid: false,
        message: `Parent directory does not exist: ${parentDir}`,
      }
    }

    // Check if target directory already exists
    if (fs.existsSync(resolvedPath)) {
      const stats = fs.statSync(resolvedPath)

      if (!stats.isDirectory()) {
        return {
          valid: false,
          message: `Path exists but is not a directory: ${resolvedPath}`,
        }
      }

      // Check if directory is empty
      const files = fs.readdirSync(resolvedPath)
      if (files.length > 0) {
        return {
          valid: false,
          message: 'Directory already exists and is not empty',
        }
      }
    }

    return {
      valid: true,
      message: '',
    }
  }
  catch (error) {
    return {
      valid: false,
      message: `Error checking directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Validate template name
 */
export function validateTemplate(template: string, availableTemplates: string[]): ValidationResult {
  if (!template || template.trim().length === 0) {
    return {
      valid: false,
      message: 'Template name cannot be empty',
    }
  }

  const trimmedTemplate = template.trim()

  if (!availableTemplates.includes(trimmedTemplate)) {
    return {
      valid: false,
      message: `Invalid template "${trimmedTemplate}". Available templates: ${availableTemplates.join(', ')}`,
    }
  }

  return {
    valid: true,
    message: '',
  }
}

/**
 * Validate package manager
 */
export function validatePackageManager(pm: string): ValidationResult {
  const validPackageManagers = ['npm', 'yarn', 'pnpm', 'bun']

  if (!pm || pm.trim().length === 0) {
    return {
      valid: false,
      message: 'Package manager cannot be empty',
    }
  }

  const trimmedPm = pm.trim().toLowerCase()

  if (!validPackageManagers.includes(trimmedPm)) {
    return {
      valid: false,
      message: `Invalid package manager "${trimmedPm}". Valid options: ${validPackageManagers.join(', ')}`,
    }
  }

  return {
    valid: true,
    message: '',
  }
}

/**
 * Validate generator type
 */
export function validateGeneratorType(type: string): ValidationResult {
  const validTypes = ['route', 'middleware', 'plugin', 'model', 'service']

  if (!type || type.trim().length === 0) {
    return {
      valid: false,
      message: 'Generator type cannot be empty',
    }
  }

  const trimmedType = type.trim().toLowerCase()

  if (!validTypes.includes(trimmedType)) {
    return {
      valid: false,
      message: `Invalid generator type "${trimmedType}". Valid types: ${validTypes.join(', ')}`,
    }
  }

  return {
    valid: true,
    message: '',
  }
}

/**
 * Validate identifier (class name, function name, etc.)
 */
export function validateIdentifier(identifier: string): ValidationResult {
  if (!identifier || identifier.trim().length === 0) {
    return {
      valid: false,
      message: 'Identifier cannot be empty',
    }
  }

  const trimmedIdentifier = identifier.trim()

  // Check if it's a valid JavaScript identifier
  const identifierRegex = /^[a-z_$][\w$]*$/i

  if (!identifierRegex.test(trimmedIdentifier)) {
    // Check if it starts with a number
    if (/^\d/.test(trimmedIdentifier)) {
      return {
        valid: false,
        message: 'Identifier cannot start with a number',
      }
    }

    return {
      valid: false,
      message: 'Identifier can only contain letters, numbers, underscore, and dollar sign',
    }
  }

  // Check for reserved JavaScript keywords
  const reservedKeywords = [
    'abstract',
    'arguments',
    'await',
    'boolean',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'double',
    'else',
    'enum',
    'eval',
    'export',
    'extends',
    'false',
    'final',
    'finally',
    'float',
    'for',
    'function',
    'goto',
    'if',
    'implements',
    'import',
    'in',
    'instanceof',
    'int',
    'interface',
    'let',
    'long',
    'native',
    'new',
    'null',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'short',
    'static',
    'super',
    'switch',
    'synchronized',
    'this',
    'throw',
    'throws',
    'transient',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'volatile',
    'while',
    'with',
    'yield',
  ]

  if (reservedKeywords.includes(trimmedIdentifier)) {
    return {
      valid: false,
      message: 'Identifier cannot be a JavaScript reserved word',
    }
  }

  return {
    valid: true,
    message: '',
  }
}
