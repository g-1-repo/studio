import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'

/**
 * Initialize a git repository in the specified directory
 */
export async function initializeGit(projectPath: string): Promise<void> {
  try {
    // Initialize git repository
    execSync('git init', { cwd: projectPath, stdio: 'pipe' })
    
    // Create initial .gitignore if it doesn't exist
    const gitignorePath = path.join(projectPath, '.gitignore')
    if (!await fs.pathExists(gitignorePath)) {
      await createDefaultGitignore(gitignorePath)
    }
    
    // Add all files
    execSync('git add .', { cwd: projectPath, stdio: 'pipe' })
    
    // Create initial commit
    execSync('git commit -m "Initial commit"', { cwd: projectPath, stdio: 'pipe' })
    
  } catch (error) {
    throw new Error(`Failed to initialize git repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if git is available
 */
export function isGitAvailable(): boolean {
  try {
    execSync('git --version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Get git user configuration
 */
export function getGitUserInfo(): { name?: string; email?: string } {
  const result: { name?: string; email?: string } = {}
  
  try {
    const name = execSync('git config user.name', { stdio: 'pipe', encoding: 'utf-8' }).trim()
    if (name) result.name = name
  } catch {
    // Ignore error, name will be undefined
  }
  
  try {
    const email = execSync('git config user.email', { stdio: 'pipe', encoding: 'utf-8' }).trim()
    if (email) result.email = email
  } catch {
    // Ignore error, email will be undefined
  }
  
  return result
}

/**
 * Check if directory is already a git repository
 */
export async function isGitRepository(dirPath: string): Promise<boolean> {
  try {
    const gitDir = path.join(dirPath, '.git')
    return await fs.pathExists(gitDir)
  } catch {
    return false
  }
}

/**
 * Create a default .gitignore file
 */
async function createDefaultGitignore(gitignorePath: string): Promise<void> {
  const gitignoreContent = `# Dependencies
node_modules/
bun.lockb
package-lock.json
yarn.lock

# Build output
dist/
build/
out/

# Environment variables
.env
.env.local
.env.production
.env.staging

# Database
*.db
*.db-journal
*.sqlite
*.sqlite3

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# TypeScript
*.tsbuildinfo

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
`

  await fs.writeFile(gitignorePath, gitignoreContent)
}

/**
 * Add and commit files to git
 */
export async function gitAddAndCommit(
  projectPath: string,
  message: string,
  files: string[] = ['.']
): Promise<void> {
  try {
    // Add files - combine all files into a single command
    const filesArg = files.join(' ')
    execSync(`git add ${filesArg}`, { cwd: projectPath, stdio: 'pipe' })
    
    // Commit
    execSync(`git commit -m "${message}"`, { cwd: projectPath, stdio: 'pipe' })
  } catch (error) {
    throw new Error(`Failed to add and commit files: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create and checkout a new branch
 */
export async function createBranch(projectPath: string, branchName: string): Promise<void> {
  try {
    execSync(`git checkout -b ${branchName}`, { cwd: projectPath, stdio: 'pipe' })
  } catch (error) {
    throw new Error(`Failed to create branch: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get current git branch
 */
export function getCurrentBranch(projectPath: string): string | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { 
      cwd: projectPath, 
      stdio: 'pipe', 
      encoding: 'utf-8' 
    }).trim()
    
    // Return null if branch name is empty (e.g., detached HEAD)
    return branch || null
  } catch {
    return null
  }
}

/**
 * Check if there are uncommitted changes
 */
export function hasUncommittedChanges(projectPath: string): boolean {
  try {
    const status = execSync('git status --porcelain', { 
      cwd: projectPath, 
      stdio: 'pipe', 
      encoding: 'utf-8' 
    }).trim()
    
    return status.length > 0
  } catch {
    return false
  }
}