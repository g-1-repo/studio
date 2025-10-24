import os from 'node:os'
import path from 'node:path'
import { Command } from 'commander'
import fs from 'fs-extra'
import { formatFileSize, getDirectorySize, readJsonFile } from '../utils/file-system.js'
import { getGitUserInfo, isGitRepository } from '../utils/git.js'
import { Logger } from '../utils/logger.js'
import { detectPackageManager, getAvailablePackageManagers } from '../utils/package-manager.js'

const logger = new Logger()

interface TsConfig {
  compilerOptions?: {
    target?: string
    module?: string
    strict?: boolean
  }
}

interface PackageJson {
  name?: string
  version?: string
  description?: string
  type?: string
  main?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  engines?: Record<string, string>
}

export function createInfoCommand(): Command {
  const command = new Command('info')
    .description('Display project and environment information')
    .option('-v, --verbose', 'Show detailed information', false)
    .option('--json', 'Output information as JSON', false)
    .action(async (options: Record<string, unknown> = {}) => {
      try {
        await infoCommand(options)
      } catch (error) {
        logger.error(
          `Failed to gather information: ${error instanceof Error ? error.message : String(error)}`
        )
        process.exit(1)
      }
    })

  return command
}

async function infoCommand(options: Record<string, unknown> = {}): Promise<void> {
  const info = await gatherProjectInfo(Boolean(options.verbose))

  if (options.json) {
    console.log(JSON.stringify(info, null, 2))
    return
  }

  displayProjectInfo(info, Boolean(options.verbose))
}

interface ProjectInfo {
  project: {
    name?: string
    version?: string
    description?: string
    type?: string
    main?: string
    scripts?: string[]
    dependencies?: string[]
    devDependencies?: string[]
    engines?: Record<string, string>
    isG1Project?: boolean
    hasG1Config?: boolean
    hasPlugins?: boolean
    pluginCount?: number
    size?: string
    typescript?: {
      target: string
      module: string
      strict: boolean
    }
  }
  environment: {
    nodeVersion?: string
    npmVersion?: string | null
    yarnVersion?: string | null
    pnpmVersion?: string | null
    bunVersion?: string | null
    gitVersion?: string | null
    packageManager?: string | null
    availablePackageManagers?: string[]
    git?: {
      isRepository?: boolean
      branch?: string
      lastCommit?: string
      user?: { name?: string; email?: string }
    }
  }
  system: {
    platform?: string
    arch?: string
    nodeEnv?: string
    cwd?: string
    memory?: {
      free: number
      total: number
    }
    cpu?: string
    projectSize?: string
  }
}

async function gatherProjectInfo(verbose: boolean = false): Promise<ProjectInfo> {
  const cwd = process.cwd()
  const info: ProjectInfo = {
    project: {},
    environment: {},
    system: {},
  }

  // Project information
  const packageJsonPath = path.join(cwd, 'package.json')
  const packageJson = await readJsonFile<PackageJson>(packageJsonPath)

  if (packageJson) {
    info.project = {
      name: packageJson.name || 'Unknown',
      version: packageJson.version || '0.0.0',
      description: packageJson.description || '',
      type: packageJson.type || 'commonjs',
      main: packageJson.main || '',
      scripts: Object.keys(packageJson.scripts || {}),
      dependencies: Object.keys(packageJson.dependencies || {}),
      devDependencies: Object.keys(packageJson.devDependencies || {}),
      engines: packageJson.engines || {},
    }

    // Check if it's a G1 project
    const isG1Project = !!(
      packageJson.dependencies?.['@g-1/core'] ||
      packageJson.devDependencies?.['@g-1/core'] ||
      packageJson.name?.startsWith('@g-1/')
    )

    info.project.isG1Project = isG1Project

    if (isG1Project && verbose) {
      // Look for G1-specific configuration
      const g1ConfigPath = path.join(cwd, 'g1.config.js')
      const g1Config = await fs.pathExists(g1ConfigPath)
      info.project.hasG1Config = g1Config

      // Check for plugins directory
      const pluginsDir = path.join(cwd, 'src', 'plugins')
      const hasPlugins = await fs.pathExists(pluginsDir)
      info.project.hasPlugins = hasPlugins

      if (hasPlugins) {
        try {
          const pluginFiles = await fs.readdir(pluginsDir)
          info.project.pluginCount = pluginFiles.filter(
            f => f.endsWith('.ts') || f.endsWith('.js')
          ).length
        } catch {
          info.project.pluginCount = 0
        }
      }
    }
  }

  // Environment information
  info.environment = {
    nodeVersion: process.version,
    npmVersion: await getToolVersion('npm'),
    yarnVersion: await getToolVersion('yarn'),
    pnpmVersion: await getToolVersion('pnpm'),
    bunVersion: await getToolVersion('bun'),
    gitVersion: await getToolVersion('git'),
    packageManager: await detectPackageManager(cwd),
    availablePackageManagers: await getAvailablePackageManagers(),
  }

  // Git information
  if (await isGitRepository(cwd)) {
    const userInfo = await getGitUserInfo()
    info.environment.git = {
      isRepository: true,
      user: userInfo,
    }

    if (verbose) {
      try {
        const { execSync } = await import('node:child_process')
        const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim()
        const lastCommit = execSync('git log -1 --format="%h %s"', { cwd, encoding: 'utf8' }).trim()

        info.environment.git!.branch = branch
        info.environment.git!.lastCommit = lastCommit
      } catch {
        // Ignore git command errors
      }
    }
  } else {
    info.environment.git = { isRepository: false }
  }

  // System information
  info.system = {
    platform: process.platform,
    arch: process.arch,
    nodeEnv: process.env.NODE_ENV || 'development',
    cwd,
  }

  if (verbose) {
    info.system.memory = {
      total: Math.round(os.totalmem() / 1024 / 1024),
      free: Math.round(os.freemem() / 1024 / 1024),
    }

    info.system.cpu = os.cpus()[0]?.model || 'Unknown'

    // Project size
    try {
      const projectSize = await getDirectorySize(cwd)
      info.system.projectSize = formatFileSize(projectSize)
    } catch {
      info.system.projectSize = 'Unknown'
    }

    // TypeScript configuration
    const tsconfigPath = path.join(cwd, 'tsconfig.json')
    const tsconfig = await readJsonFile<TsConfig>(tsconfigPath)
    if (tsconfig) {
      info.project.typescript = {
        target: tsconfig.compilerOptions?.target || 'Unknown',
        module: tsconfig.compilerOptions?.module || 'Unknown',
        strict: tsconfig.compilerOptions?.strict || false,
      }
    }
  }

  return info
}

function displayProjectInfo(info: ProjectInfo, verbose: boolean = false): void {
  logger.header('📊 Project Information')

  // Project details
  if (info.project.name) {
    logger.subheader('Project:')
    logger.listItem(`Name: ${info.project.name}`)
    logger.listItem(`Version: ${info.project.version}`)

    if (info.project.description) {
      logger.listItem(`Description: ${info.project.description}`)
    }

    logger.listItem(`Type: ${info.project.type}`)

    if (info.project.isG1Project) {
      logger.listItem('🚀 G1 Framework Project')

      if (verbose && info.project.hasG1Config) {
        logger.listItem('✅ G1 Configuration found')
      }

      if (verbose && info.project.hasPlugins) {
        logger.listItem(`🔌 Plugins: ${info.project.pluginCount}`)
      }
    }

    if (verbose && info.project.size) {
      logger.listItem(`Size: ${info.project.size}`)
    }

    if (info.project.scripts && info.project.scripts.length > 0) {
      logger.listItem(`Scripts: ${info.project.scripts.join(', ')}`)
    }

    if (verbose && info.project.typescript) {
      logger.listItem(
        `TypeScript: ${info.project.typescript.target}/${info.project.typescript.module}`
      )
    }
  }

  // Environment details
  logger.newLine()
  logger.subheader('Environment:')
  logger.listItem(`Node.js: ${info.environment.nodeVersion}`)
  logger.listItem(`Package Manager: ${info.environment.packageManager}`)

  if (verbose) {
    const versions = []
    if (info.environment.npmVersion) versions.push(`npm@${info.environment.npmVersion}`)
    if (info.environment.yarnVersion) versions.push(`yarn@${info.environment.yarnVersion}`)
    if (info.environment.pnpmVersion) versions.push(`pnpm@${info.environment.pnpmVersion}`)
    if (info.environment.bunVersion) versions.push(`bun@${info.environment.bunVersion}`)

    if (versions.length > 0) {
      logger.listItem(`Available: ${versions.join(', ')}`)
    }
  }

  if (info.environment.gitVersion) {
    logger.listItem(`Git: ${info.environment.gitVersion}`)
  }

  // Git information
  if (info.environment.git?.isRepository) {
    logger.listItem('📁 Git Repository')

    if (verbose && info.environment.git.branch) {
      logger.listItem(`Branch: ${info.environment.git.branch}`)
    }

    if (verbose && info.environment.git.lastCommit) {
      logger.listItem(`Last Commit: ${info.environment.git.lastCommit}`)
    }
  }

  // System information
  if (verbose) {
    logger.newLine()
    logger.subheader('System:')
    logger.listItem(`Platform: ${info.system.platform} (${info.system.arch})`)
    logger.listItem(`Environment: ${info.system.nodeEnv}`)

    if (info.system.memory) {
      logger.listItem(
        `Memory: ${info.system.memory.free}MB free / ${info.system.memory.total}MB total`
      )
    }

    if (info.system.cpu) {
      logger.listItem(`CPU: ${info.system.cpu}`)
    }
  }

  // Dependencies
  if (
    verbose &&
    ((info.project.dependencies?.length || 0) > 0 || (info.project.devDependencies?.length || 0) > 0)
  ) {
    logger.newLine()
    logger.subheader('Dependencies:')

    if ((info.project.dependencies?.length || 0) > 0) {
      logger.listItem(`Production: ${info.project.dependencies?.length} packages`)
    }

    if ((info.project.devDependencies?.length || 0) > 0) {
      logger.listItem(`Development: ${info.project.devDependencies?.length} packages`)
    }
  }
}

async function getToolVersion(tool: string): Promise<string | null> {
  try {
    const { execSync } = await import('node:child_process')
    const version = execSync(`${tool} --version`, { encoding: 'utf8', stdio: 'pipe' })
    return version.trim().split('\n')[0]
  } catch {
    return null
  }
}

export default createInfoCommand
