#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packagesDir = join(__dirname, 'packages')

function fixImportsInFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8')
    let modified = false

    // Fix relative imports that don't have .js extension
    content = content.replace(/from\s+['"](\.[^'"]*?)(?<!\.js)['"];?/g, (match, importPath) => {
      // Skip if already has .js extension
      if (importPath.endsWith('.js')) {
        return match
      }

      // Add .js extension for relative imports
      const newImportPath = `${importPath}.js`

      modified = true
      return match.replace(importPath, newImportPath)
    })

    // Fix export statements with relative paths
    content = content.replace(
      /export\s+.*?\s+from\s+['"](\.[^'"]*?)(?<!\.js)['"];?/g,
      (match, importPath) => {
        // Skip if already has .js extension
        if (importPath.endsWith('.js')) {
          return match
        }

        // Add .js extension for relative imports
        const newImportPath = `${importPath}.js`

        modified = true
        return match.replace(importPath, newImportPath)
      }
    )

    // Fix import statements with relative paths
    content = content.replace(
      /import\s+.*?\s+from\s+['"](\.[^'"]*?)(?<!\.js)['"];?/g,
      (match, importPath) => {
        // Skip if already has .js extension
        if (importPath.endsWith('.js')) {
          return match
        }

        // Add .js extension for relative imports
        const newImportPath = `${importPath}.js`

        modified = true
        return match.replace(importPath, newImportPath)
      }
    )

    if (modified) {
      writeFileSync(filePath, content, 'utf8')
      console.log(`Fixed imports in: ${filePath}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
}

function walkDirectory(dir) {
  const files = readdirSync(dir)

  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      walkDirectory(filePath)
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath)
    }
  }
}

console.log('Fixing import paths in all built JavaScript files...')

// Fix imports in all packages
const packages = readdirSync(packagesDir)
for (const pkg of packages) {
  const distDir = join(packagesDir, pkg, 'dist')
  try {
    const stat = statSync(distDir)
    if (stat.isDirectory()) {
      console.log(`Processing package: ${pkg}`)
      walkDirectory(distDir)
    }
  } catch (_error) {
    console.log(`Skipping ${pkg} (no dist directory)`)
  }
}

console.log('Done!')
