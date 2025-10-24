import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'fs-extra'

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

/**
 * Install dependencies using the specified package manager
 */
export async function installDependencies(
  projectPath: string,
  packageManager: PackageManager = 'bun'
): Promise<void> {
  try {
    const command = getInstallCommand(packageManager)
    execSync(command, { cwd: projectPath, stdio: 'inherit' })
  } catch (error) {
    throw new Error(
      `Failed to install dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get the install command for a package manager
 */
export function getInstallCommand(packageManager: PackageManager): string {
  switch (packageManager) {
    case 'npm':
      return 'npm install'
    case 'yarn':
      return 'yarn install'
    case 'pnpm':
      return 'pnpm install'
    case 'bun':
      return 'bun install'
    default:
      throw new Error(`Unknown package manager: ${packageManager}`)
  }
}

/**
 * Get the run command for a package manager
 */
export function getRunCommand(packageManager: PackageManager, script: string): string {
  switch (packageManager) {
    case 'npm':
      return `npm run ${script}`
    case 'yarn':
      return `yarn ${script}`
    case 'pnpm':
      return `pnpm run ${script}`
    case 'bun':
      return `bun run ${script}`
    default:
      throw new Error(`Unknown package manager: ${packageManager}`)
  }
}

/**
 * Detect which package manager is being used in a project
 */
export async function detectPackageManager(projectPath: string): Promise<PackageManager | null> {
  const lockFiles = [
    { file: 'bun.lockb', manager: 'bun' as const },
    { file: 'yarn.lock', manager: 'yarn' as const },
    { file: 'pnpm-lock.yaml', manager: 'pnpm' as const },
    { file: 'package-lock.json', manager: 'npm' as const },
  ]

  for (const { file, manager } of lockFiles) {
    const lockFilePath = path.join(projectPath, file)
    if (await fs.pathExists(lockFilePath)) {
      return manager
    }
  }

  // Check package.json for packageManager field
  const packageJsonPath = path.join(projectPath, 'package.json')
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJson(packageJsonPath)
      if (packageJson.packageManager) {
        const pmName = packageJson.packageManager.split('@')[0]
        if (['npm', 'yarn', 'pnpm', 'bun'].includes(pmName)) {
          return pmName as PackageManager
        }
      }
    } catch {
      // Ignore JSON parsing errors
    }
  }

  return null
}

/**
 * Check if a package manager is available
 */
export function isPackageManagerAvailable(packageManager: PackageManager): boolean {
  try {
    execSync(`${packageManager} --version`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * Get available package managers on the system
 */
export function getAvailablePackageManagers(): PackageManager[] {
  const managers: PackageManager[] = ['npm', 'yarn', 'pnpm', 'bun']
  return managers.filter(isPackageManagerAvailable)
}

/**
 * Get the preferred package manager (bun > pnpm > yarn > npm)
 */
export function getPreferredPackageManager(): PackageManager {
  const available = getAvailablePackageManagers()
  const preference: PackageManager[] = ['bun', 'pnpm', 'yarn', 'npm']

  for (const pm of preference) {
    if (available.includes(pm)) {
      return pm
    }
  }

  return 'npm' // Fallback to npm (should always be available)
}

/**
 * Add dependencies to a project
 */
export async function addDependencies(
  projectPath: string,
  dependencies: string[],
  options: {
    dev?: boolean
    packageManager?: PackageManager
  } = {}
): Promise<void> {
  const { dev = false, packageManager = 'bun' } = options

  if (dependencies.length === 0) {
    return
  }

  try {
    const command = getAddCommand(packageManager, dependencies, dev)
    execSync(command, { cwd: projectPath, stdio: 'inherit' })
  } catch (error) {
    throw new Error(
      `Failed to add dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get the add command for a package manager
 */
function getAddCommand(
  packageManager: PackageManager,
  dependencies: string[],
  dev: boolean
): string {
  const deps = dependencies.join(' ')

  switch (packageManager) {
    case 'npm':
      return dev ? `npm install --save-dev ${deps}` : `npm install ${deps}`
    case 'yarn':
      return dev ? `yarn add --dev ${deps}` : `yarn add ${deps}`
    case 'pnpm':
      return dev ? `pnpm add --save-dev ${deps}` : `pnpm add ${deps}`
    case 'bun':
      return dev ? `bun add --dev ${deps}` : `bun add ${deps}`
    default:
      throw new Error(`Unknown package manager: ${packageManager}`)
  }
}

/**
 * Remove dependencies from a project
 */
export async function removeDependencies(
  projectPath: string,
  dependencies: string[],
  packageManager: PackageManager = 'bun'
): Promise<void> {
  if (dependencies.length === 0) {
    return
  }

  try {
    const command = getRemoveCommand(packageManager, dependencies)
    execSync(command, { cwd: projectPath, stdio: 'inherit' })
  } catch (error) {
    throw new Error(
      `Failed to remove dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get the remove command for a package manager
 */
function getRemoveCommand(packageManager: PackageManager, dependencies: string[]): string {
  const deps = dependencies.join(' ')

  switch (packageManager) {
    case 'npm':
      return `npm uninstall ${deps}`
    case 'yarn':
      return `yarn remove ${deps}`
    case 'pnpm':
      return `pnpm remove ${deps}`
    case 'bun':
      return `bun remove ${deps}`
    default:
      throw new Error(`Unknown package manager: ${packageManager}`)
  }
}

/**
 * Run a script using the package manager
 */
export async function runScript(
  projectPath: string,
  script: string,
  packageManager: PackageManager = 'bun'
): Promise<void> {
  try {
    const command = getRunCommand(packageManager, script)
    execSync(command, { cwd: projectPath, stdio: 'inherit' })
  } catch (error) {
    throw new Error(
      `Failed to run script: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Check if a script exists in package.json
 */
export async function hasScript(projectPath: string, script: string): Promise<boolean> {
  try {
    const packageJsonPath = path.join(projectPath, 'package.json')
    const packageJson = await fs.readJson(packageJsonPath)
    return !!packageJson.scripts?.[script]
  } catch {
    return false
  }
}
