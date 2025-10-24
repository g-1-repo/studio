import { Command } from 'commander'
import fs from 'fs-extra'
import os from 'node:os'
import path from 'node:path'
import { formatFileSize, getDirectorySize, readJsonFile } from '../utils/file-system.js'
import { getGitUserInfo, isGitRepository } from '../utils/git.js'
import { Logger } from '../utils/logger.js'
import { detectPackageManager, getAvailablePackageManagers } from '../utils/package-manager.js'

// Create logger instance that can be mocked in tests
export const logger = new Logger()

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
  const npmVersion = await getToolVersion('npm')
  const yarnVersion = await getToolVersion('yarn')
  const pnpmVersion = await getToolVersion('pnpm')
  const bunVersion = await getToolVersion('bun')
  const gitVersion = await getToolVersion('git')

  info.environment = {
    nodeVersion: process.version,
    npmVersion,
    yarnVersion,
    pnpmVersion,
    bunVersion,
    gitVersion,
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
  logger.newLine()

  // Project Information
  if (info.project.name) {
    logger.listItem(`Name: ${info.project.name}`)
  }
  if (info.project.version) {
    logger.listItem(`Version: ${info.project.version}`)
  }
  if (info.project.description) {
    logger.listItem(`Description: ${info.project.description}`)
  }
  if (info.project.type) {
    logger.listItem(`Type: ${info.project.type}`)
  }
  if (info.project.main) {
    logger.listItem(`Main: ${info.project.main}`)
  }

  // G1 Project Information
  if (info.project.isG1Project) {
    logger.listItem('� G1 Project: Yes')
    if (info.project.hasG1Config) {
      logger.listItem('⚙️ G1 Config: Found')
    }
    if (info.project.hasPlugins) {
      logger.listItem(`🔌 Plugins: ${info.project.pluginCount || 0}`)
    } else {
      logger.listItem('🔌 Plugins: 0')
    }
  }

  // Dependencies
  if (info.project.dependencies && info.project.dependencies.length > 0) {
    logger.listItem(`Dependencies: ${info.project.dependencies.length}`)
    if (verbose) {
      info.project.dependencies.forEach((dep) => {
        logger.listItem(`  - ${dep}`, 2)
      })
    }
  }

  if (info.project.devDependencies && info.project.devDependencies.length > 0) {
    logger.listItem(`Dev Dependencies: ${info.project.devDependencies.length}`)
    if (verbose) {
      info.project.devDependencies.forEach((dep) => {
        logger.listItem(`  - ${dep}`, 2)
      })
    }
  }

  // Scripts
  if (info.project.scripts && info.project.scripts.length > 0) {
    logger.listItem(`Scripts: ${info.project.scripts.length}`)
    if (verbose) {
      info.project.scripts.forEach((script) => {
        logger.listItem(`  - ${script}`, 2)
      })
    }
  }

  // TypeScript Configuration
  if (info.project.typescript) {
    logger.listItem('TypeScript Configuration:')
    logger.listItem(`  Target: ${info.project.typescript.target}`, 2)
    logger.listItem(`  Module: ${info.project.typescript.module}`, 2)
    logger.listItem(`  Strict: ${info.project.typescript.strict}`, 2)
  }

  // Project Size
  if (info.project.size) {
    logger.listItem(`Project Size: ${info.project.size}`)
  }

  logger.newLine()

  // Environment Information
  logger.subheader('🌍 Environment')
  if (info.environment.nodeVersion) {
    logger.listItem(`Node.js: ${info.environment.nodeVersion}`)
  }
  if (info.environment.packageManager) {
    logger.listItem(`Package Manager: ${info.environment.packageManager}`)
  }
  if (info.environment.npmVersion) {
    logger.listItem(`npm: ${info.environment.npmVersion}`)
  }
  if (info.environment.yarnVersion) {
    logger.listItem(`Yarn: ${info.environment.yarnVersion}`)
  }
  if (info.environment.pnpmVersion) {
    logger.listItem(`pnpm: ${info.environment.pnpmVersion}`)
  }
  if (info.environment.bunVersion) {
    logger.listItem(`Bun: ${info.environment.bunVersion}`)
  }
  if (info.environment.gitVersion) {
    logger.listItem(`Git: ${info.environment.gitVersion}`)
  }

  // Git Information
  if (info.environment.git?.isRepository) {
    logger.newLine()
    logger.subheader('� Git Repository')
    if (info.environment.git.branch) {
      logger.listItem(`Branch: ${info.environment.git.branch}`)
    }
    if (info.environment.git.lastCommit) {
      logger.listItem(`Last Commit: ${info.environment.git.lastCommit}`)
    }
    if (info.environment.git.user?.name) {
      logger.listItem(`User: ${info.environment.git.user.name}`)
    }
    if (info.environment.git.user?.email) {
      logger.listItem(`Email: ${info.environment.git.user.email}`)
    }
  }

  // System Information (only in verbose mode)
  if (verbose) {
    logger.newLine()
    logger.subheader('💻 System')
    if (info.system.platform) {
      logger.listItem(`Platform: ${info.system.platform}`)
    }
    if (info.system.arch) {
      logger.listItem(`Architecture: ${info.system.arch}`)
    }
    if (info.system.nodeEnv) {
      logger.listItem(`NODE_ENV: ${info.system.nodeEnv}`)
    }
    if (info.system.cwd) {
      logger.listItem(`Working Directory: ${info.system.cwd}`)
    }
    if (info.system.memory) {
      const freeMemory = (info.system.memory.free / 1024 / 1024 / 1024).toFixed(2)
      const totalMemory = (info.system.memory.total / 1024 / 1024 / 1024).toFixed(2)
      logger.listItem(`Memory: ${freeMemory}GB free / ${totalMemory}GB total`)
    }
    if (info.system.cpu) {
      logger.listItem(`CPU: ${info.system.cpu}`)
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
