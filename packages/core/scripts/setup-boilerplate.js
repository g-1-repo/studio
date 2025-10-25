#!/usr/bin/env node

/**
 * Boilerplate Setup Script
 *
 * This script reads boilerplate.config.js and replaces all template values
 * throughout the codebase to customize it for a new project.
 *
 * Usage:
 *   node scripts/setup-boilerplate.js
 *
 * Or add to package.json:
 *   "setup": "node scripts/setup-boilerplate.js"
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// Import configuration (dynamic import for ES modules)
const { boilerplateConfig, derived } = await import(path.join(projectRoot, 'boilerplate.config.js'))

// Files to process (glob patterns would be better but keeping it simple)
// Note: Currently using dynamic file discovery instead of this static list
// const filesToProcess = [
//   'package.json',
//   'wrangler.jsonc',
//   'README.md',
//   'README.md',
//   'worker-configuration.d.ts',
//   'src/**/*.ts',
//   'src/**/*.js',
//   'scripts/**/*.ts',
//   'scripts/**/*.js',
// ]

// Replacement mappings
const replacements = {
  // Current hardcoded values -> template values
  'g1-core': boilerplateConfig.projectName,
  g1_core: derived.snakeCase,
  GO_BOILERPLATE_KV_AUTH: boilerplateConfig.kvNamespace,
  '@g-1': boilerplateConfig.orgScope,

  // Generic template placeholders
  '{{PROJECT_NAME}}': boilerplateConfig.projectName,
  '{{PROJECT_DISPLAY_NAME}}': boilerplateConfig.projectDisplayName,
  '{{PROJECT_DESCRIPTION}}': boilerplateConfig.projectDescription,
  '{{PACKAGE_NAME}}': boilerplateConfig.packageName,
  '{{PACKAGE_VERSION}}': boilerplateConfig.packageVersion,
  '{{ORG_SCOPE}}': boilerplateConfig.orgScope,
  '{{ORG_NAME}}': boilerplateConfig.orgName,
  '{{AUTHOR_NAME}}': boilerplateConfig.authorName,
  '{{AUTHOR_EMAIL}}': boilerplateConfig.authorEmail,
  '{{SUPPORT_EMAIL}}': boilerplateConfig.supportEmail,
  '{{HOMEPAGE_URL}}': boilerplateConfig.homepageUrl,
  '{{REPOSITORY_URL}}': boilerplateConfig.repositoryUrl,
  '{{ISSUES_URL}}': boilerplateConfig.issuesUrl,
  '{{WORKER_NAME}}': boilerplateConfig.workerName,
  '{{DATABASE_NAME}}': boilerplateConfig.databaseName,
  '{{KV_NAMESPACE}}': boilerplateConfig.kvNamespace,
  '{{API_TITLE}}': boilerplateConfig.apiTitle,
  '{{API_VERSION}}': boilerplateConfig.apiVersion,
  '{{API_DESCRIPTION}}': boilerplateConfig.apiDescription,
  '{{DEV_PORT}}': boilerplateConfig.devPort.toString(),
}

async function getAllFiles(dir, pattern = '*') {
  const files = []
  const items = await fs.readdir(dir, { withFileTypes: true })

  for (const item of items) {
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      files.push(...(await getAllFiles(path.join(dir, item.name), pattern)))
    } else if (item.isFile()) {
      files.push(path.join(dir, item.name))
    }
  }

  return files
}

async function replaceInFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    let newContent = content

    // Apply all replacements
    for (const [search, replace] of Object.entries(replacements)) {
      // Use global regex for all occurrences
      newContent = newContent.replaceAll(search, replace)
    }

    // Only write if content changed
    if (newContent !== content) {
      await fs.writeFile(filePath, newContent, 'utf-8')
      console.log(`✓ Updated: ${path.relative(projectRoot, filePath)}`)
      return true
    }

    return false
  } catch {
    console.error(`✗ Error processing ${filePath}:`, 'Unknown error')
    return false
  }
}

async function main() {
  console.log('🚀 Setting up boilerplate with configuration:')
  console.log(JSON.stringify(boilerplateConfig, null, 2))
  console.log('')

  // Get all relevant files
  const allFiles = await getAllFiles(projectRoot)
  const targetFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase()
    return (
      ['.ts', '.js', '.json', '.md', '.jsonc'].includes(ext) &&
      !file.includes('node_modules') &&
      !file.includes('.git') &&
      !file.includes('coverage') &&
      !file.includes('dist') &&
      !file.endsWith('setup-boilerplate.js')
    ) // Don't process this script
  })

  console.log(`📁 Processing ${targetFiles.length} files...`)
  console.log('')

  let updatedCount = 0
  for (const file of targetFiles) {
    const wasUpdated = await replaceInFile(file)
    if (wasUpdated) updatedCount++
  }

  console.log('')
  console.log(`✅ Setup complete! Updated ${updatedCount} files.`)
  console.log('')
  console.log('Next steps:')
  console.log('1. Review the changes: git diff')
  console.log('2. Update Cloudflare D1 database ID in wrangler.jsonc')
  console.log('3. Update KV namespace ID in wrangler.jsonc')
  console.log('4. Test the setup: bun run dev')
  console.log('5. Delete this setup script and boilerplate.config.js')
}

main().catch(console.error)
