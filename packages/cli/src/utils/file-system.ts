import path from 'node:path'
import fs from 'fs-extra'

/**
 * Ensure directory exists and is writable
 */
export async function ensureWritableDirectory(dirPath: string): Promise<void> {
  try {
    await fs.ensureDir(dirPath)

    // Test write access by creating a temporary file
    const testFile = path.join(dirPath, '.write-test')
    await fs.writeFile(testFile, 'test')
    await fs.remove(testFile)
  }
  catch {
    throw new Error(`Directory is not writable: ${dirPath}`)
  }
}

/**
 * Check if directory is empty
 */
export async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const files = await fs.readdir(dirPath)
    return files.length === 0
  }
  catch {
    return true // Directory doesn't exist, so it's "empty"
  }
}

/**
 * Copy directory with filtering
 */
export async function copyDirectory(
  src: string,
  dest: string,
  options: {
    filter?: (src: string, dest: string) => boolean
    overwrite?: boolean
  } = {},
): Promise<void> {
  const { filter, overwrite = false } = options

  await fs.ensureDir(dest)

  const entries = await fs.readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    // Apply filter if provided
    if (filter && !filter(srcPath, destPath)) {
      continue
    }

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, options)
    }
    else {
      // Check if destination exists and overwrite is disabled
      if (!overwrite && await fs.pathExists(destPath)) {
        continue
      }

      await fs.copy(srcPath, destPath)
    }
  }
}

/**
 * Find files matching a pattern
 */
export async function findFiles(
  dirPath: string,
  pattern: RegExp,
  options: {
    recursive?: boolean
    includeDirectories?: boolean
  } = {},
): Promise<string[]> {
  const { recursive = true, includeDirectories = false } = options
  const results: string[] = []

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        if (includeDirectories && pattern.test(entry.name)) {
          results.push(fullPath)
        }

        if (recursive) {
          const subResults = await findFiles(fullPath, pattern, options)
          results.push(...subResults)
        }
      }
      else if (pattern.test(entry.name)) {
        results.push(fullPath)
      }
    }
  }
  catch {
    // Ignore errors (e.g., permission denied)
  }

  return results
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath: string): Promise<number> {
  try {
    const stats = await fs.stat(filePath)
    return stats.size
  }
  catch {
    return 0
  }
}

/**
 * Get directory size recursively
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)

      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath)
      }
      else {
        totalSize += await getFileSize(fullPath)
      }
    }
  }
  catch {
    // Ignore errors
  }

  return totalSize
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`
}

/**
 * Create a backup of a file or directory
 */
export async function createBackup(
  sourcePath: string,
  backupDir?: string,
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const basename = path.basename(sourcePath)
  const backupName = `${basename}.backup.${timestamp}`

  const backupPath = backupDir
    ? path.join(backupDir, backupName)
    : path.join(path.dirname(sourcePath), backupName)

  await fs.copy(sourcePath, backupPath)
  return backupPath
}

/**
 * Clean up temporary files and directories
 */
export async function cleanup(paths: string[]): Promise<void> {
  for (const filePath of paths) {
    try {
      await fs.remove(filePath)
    }
    catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Check if path is safe (not outside project directory)
 */
export function isSafePath(targetPath: string, basePath: string): boolean {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedBase = path.resolve(basePath)

  return resolvedTarget.startsWith(resolvedBase)
}

/**
 * Make file executable (Unix-like systems)
 */
export async function makeExecutable(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath)
    const mode = stats.mode | Number.parseInt('755', 8)
    await fs.chmod(filePath, mode)
  }
  catch {
    // Ignore errors on systems that don't support chmod
  }
}

/**
 * Read JSON file with error handling
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T | null> {
  try {
    return await fs.readJson(filePath)
  }
  catch {
    return null
  }
}

/**
 * Write JSON file with formatting
 */
export async function writeJsonFile(
  filePath: string,
  data: any,
  options: {
    spaces?: number
    ensureDir?: boolean
  } = {},
): Promise<void> {
  const { spaces = 2, ensureDir = true } = options

  if (ensureDir) {
    await fs.ensureDir(path.dirname(filePath))
  }

  await fs.writeJson(filePath, data, { spaces })
}

/**
 * Check if file has specific extension
 */
export function hasExtension(filePath: string, extensions: string[]): boolean {
  const ext = path.extname(filePath).toLowerCase()
  return extensions.some(extension =>
    ext === (extension.startsWith('.') ? extension : `.${extension}`),
  )
}

/**
 * Get relative path from base directory
 */
export function getRelativePath(filePath: string, basePath: string): string {
  return path.relative(basePath, filePath)
}

/**
 * Normalize path separators for current platform
 */
export function normalizePath(filePath: string): string {
  return path.normalize(filePath)
}
