import { Command } from 'commander'
import path from 'path'
import { readJsonFile } from '../utils/file-system.js'
import { Logger } from '../utils/logger.js'

const logger = new Logger()

export function createVersionCommand(): Command {
  const command = new Command('version')
    .description('Display version information')
    .option('--json', 'Output version information as JSON', false)
    .option('-a, --all', 'Show all related package versions', false)
    .action(async (options: any = {}) => {
      try {
        await versionCommand(options)
      } catch (error) {
        logger.error(`Failed to get version information: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }
    })

  return command
}

async function versionCommand(options: any = {}): Promise<void> {
  const versionInfo = await gatherVersionInfo(options.all)

  if (options.json) {
    console.log(JSON.stringify(versionInfo, null, 2))
    return
  }

  displayVersionInfo(versionInfo, options.all)
}

async function gatherVersionInfo(includeAll: boolean = false): Promise<any> {
  const info: any = {
    cli: null,
    project: null,
    g1Dependencies: {}
  }

  // Get CLI version
  const currentFileUrl = new URL(import.meta.url)
  const currentDir = path.dirname(currentFileUrl.pathname)
  const cliPackageJsonPath = path.resolve(currentDir, '../../package.json')
  const cliPackageJson = await readJsonFile(cliPackageJsonPath)

  if (cliPackageJson) {
    info.cli = {
      name: cliPackageJson.name,
      version: cliPackageJson.version
    }
  }

  // Get current project's G1 version if applicable
  const cwd = process.cwd()
  const projectPackageJsonPath = path.join(cwd, 'package.json')
  const projectPackageJson = await readJsonFile(projectPackageJsonPath)

  if (projectPackageJson) {
    info.project = {
      name: projectPackageJson.name,
      version: projectPackageJson.version
    }

    // Check for G1 dependencies
    const g1Dependencies: Record<string, string> = {}
    const allDeps = {
      ...projectPackageJson.dependencies,
      ...projectPackageJson.devDependencies
    }

    for (const [name, version] of Object.entries(allDeps)) {
      if (typeof name === 'string' && name.startsWith('@g-1/')) {
        g1Dependencies[name] = version as string
      }
    }

    info.g1Dependencies = g1Dependencies
  }

  if (includeAll) {
    // Get Node.js version
    info.node = process.version

    // Get npm version
    try {
      const { execSync } = await import('child_process')
      const npmVersion = execSync('npm --version', { encoding: 'utf8', stdio: 'pipe' }).trim()
      info.npm = npmVersion
    } catch {
      info.npm = 'Not available'
    }

    // Get other package manager versions
    const packageManagers = ['yarn', 'pnpm', 'bun']
    for (const pm of packageManagers) {
      try {
        const { execSync } = await import('child_process')
        const version = execSync(`${pm} --version`, { encoding: 'utf8', stdio: 'pipe' }).trim()
        info[pm] = version
      } catch {
        info[pm] = 'Not available'
      }
    }

    // Get TypeScript version if available
    try {
      const { execSync } = await import('child_process')
      const tsVersion = execSync('npx tsc --version', { encoding: 'utf8', stdio: 'pipe' }).trim()
      info.typescript = tsVersion.replace('Version ', '')
    } catch {
      info.typescript = 'Not available'
    }

    // Get Git version
    try {
      const { execSync } = await import('child_process')
      const gitVersion = execSync('git --version', { encoding: 'utf8', stdio: 'pipe' }).trim()
      info.git = gitVersion.replace('git version ', '')
    } catch {
      info.git = 'Not available'
    }

    // System information
    info.system = {
      platform: process.platform,
      arch: process.arch,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  }

  return info
}

export function displayVersionInfo(info: any, showAll: boolean = false, customLogger?: Logger): void {
  const loggerInstance = customLogger || logger
  loggerInstance.header('📋 Version Information')

  // CLI version
  if (info.cli) {
    loggerInstance.subheader('G1 CLI:')
    loggerInstance.listItem(`${info.cli.name}: ${info.cli.version}`)
  }

  // Project version
  if (info.project) {
    loggerInstance.newLine()
    loggerInstance.subheader('Current Project:')
    loggerInstance.listItem(`${info.project.name}: ${info.project.version}`)
  }

  // G1 dependencies
  if (info.g1Dependencies && Object.keys(info.g1Dependencies).length > 0) {
    loggerInstance.newLine()
    loggerInstance.subheader('G1 Framework Dependencies:')
    for (const [name, version] of Object.entries(info.g1Dependencies)) {
      loggerInstance.listItem(`${name}: ${version}`)
    }
  }

  if (showAll) {
    // Runtime versions
    loggerInstance.newLine()
    loggerInstance.subheader('Runtime Environment:')
    loggerInstance.listItem(`Node.js: ${info.node}`)

    if (info.npm !== 'Not available') {
      loggerInstance.listItem(`npm: ${info.npm}`)
    }

    if (info.yarn !== 'Not available') {
      loggerInstance.listItem(`Yarn: ${info.yarn}`)
    }

    if (info.pnpm !== 'Not available') {
      loggerInstance.listItem(`pnpm: ${info.pnpm}`)
    }

    if (info.bun !== 'Not available') {
      loggerInstance.listItem(`Bun: ${info.bun}`)
    }

    // Development tools
    loggerInstance.newLine()
    loggerInstance.subheader('Development Tools:')

    if (info.typescript !== 'Not available') {
      loggerInstance.listItem(`TypeScript: ${info.typescript}`)
    }

    if (info.git !== 'Not available') {
      loggerInstance.listItem(`Git: ${info.git}`)
    }

    // System information
    loggerInstance.newLine()
    loggerInstance.subheader('System:')
    loggerInstance.listItem(`Platform: ${info.system.platform}`)
    loggerInstance.listItem(`Architecture: ${info.system.arch}`)
    loggerInstance.listItem(`Environment: ${info.system.nodeEnv}`)
  }

  // Show help for getting more information
  if (!showAll) {
    loggerInstance.newLine()
    loggerInstance.info('💡 Use --all flag to see detailed version information')
  }
}

export default createVersionCommand

// Export internal functions for testing
export { gatherVersionInfo }
