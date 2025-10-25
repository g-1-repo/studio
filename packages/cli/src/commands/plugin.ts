import { Command } from 'commander'
import inquirer from 'inquirer'
import path from 'node:path'
import fs from 'fs-extra'
import { logger } from '../utils/logger.js'
import { CliPluginManager } from '../plugins/manager.js'
import { builtinPlugins } from '@g-1/core/plugins/builtin'
import type { CliPlugin } from '@g-1/core/plugins/types'

/**
 * Plugin management command with subcommands
 */
export function createPluginCommand(): Command {
  const pluginCommand = new Command('plugin')
    .description('Manage G1 framework plugins')
    .alias('plugins')

  // Add subcommands
  pluginCommand.addCommand(createAddCommand())
  pluginCommand.addCommand(createRemoveCommand())
  pluginCommand.addCommand(createListCommand())
  pluginCommand.addCommand(createUpdateCommand())
  pluginCommand.addCommand(createConfigureCommand())
  pluginCommand.addCommand(createInfoCommand())

  return pluginCommand
}

/**
 * Add plugin command
 */
function createAddCommand(): Command {
  return new Command('add')
    .description('Add a plugin to the current project')
    .argument('[plugin]', 'Plugin name or path')
    .option('-c, --configure', 'Configure plugin after adding')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--dev', 'Add as development dependency')
    .action(async (pluginName: string | undefined, options) => {
      try {
        const projectRoot = process.cwd()
        const manager = new CliPluginManager(projectRoot)

        // Check if we're in a G1 project
        if (!await isG1Project(projectRoot)) {
          logger.error('❌ Not in a G1 project directory')
          logger.info('💡 Run this command from the root of a G1 project')
          process.exit(1)
        }

        let selectedPlugin: string

        if (!pluginName) {
          // Show available plugins
          const availablePlugins = await getAvailablePlugins(manager)
          
          if (availablePlugins.length === 0) {
            logger.info('ℹ️  No additional plugins available')
            return
          }

          const { plugin } = await inquirer.prompt([
            {
              type: 'list',
              name: 'plugin',
              message: 'Select a plugin to add:',
              choices: availablePlugins.map(p => ({
                name: `${p.id} - ${p.description}`,
                value: p.id
              }))
            }
          ])

          selectedPlugin = plugin
        } else {
          selectedPlugin = pluginName
        }

        // Find the plugin
        const plugin = await findPlugin(selectedPlugin, manager)
        if (!plugin) {
          logger.error(`❌ Plugin '${selectedPlugin}' not found`)
          logger.info('💡 Use `g1 plugin list --available` to see available plugins')
          process.exit(1)
        }

        // Check if already installed
        const installedPlugins = await manager.getInstalledPlugins()
        if (installedPlugins.some(p => p.id === plugin.id)) {
          logger.warn(`⚠️  Plugin '${plugin.id}' is already installed`)
          return
        }

        // Confirm installation
        if (!options.yes) {
          logger.subheader(`📦 Plugin: ${plugin.id}`)
          logger.listItem(`Description: ${plugin.description}`)
          logger.listItem(`Category: ${plugin.category}`)
          
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Install this plugin?',
              default: true
            }
          ])

          if (!confirm) {
            logger.info('❌ Installation cancelled')
            return
          }
        }

        // Install plugin
        logger.info(`📦 Installing plugin: ${plugin.id}`)
        await manager.installPlugin(plugin.id, { dev: options.dev })

        logger.success(`✅ Plugin '${plugin.id}' installed successfully`)

        // Configure plugin if requested
        if (options.configure) {
          await configurePlugin(plugin, manager)
        }

      } catch (error) {
        logger.error(`❌ Failed to add plugin: ${(error as Error).message}`)
        process.exit(1)
      }
    })
}

/**
 * Remove plugin command
 */
function createRemoveCommand(): Command {
  return new Command('remove')
    .description('Remove a plugin from the current project')
    .argument('[plugin]', 'Plugin name')
    .option('-y, --yes', 'Skip confirmation prompts')
    .alias('rm')
    .action(async (pluginName: string | undefined, options) => {
      try {
        const projectRoot = process.cwd()
        const manager = new CliPluginManager(projectRoot)

        if (!await isG1Project(projectRoot)) {
          logger.error('❌ Not in a G1 project directory')
          process.exit(1)
        }

        const installedPlugins = await manager.getInstalledPlugins()
        
        if (installedPlugins.length === 0) {
          logger.info('ℹ️  No plugins installed')
          return
        }

        let selectedPlugin: string

        if (!pluginName) {
          const { plugin } = await inquirer.prompt([
            {
              type: 'list',
              name: 'plugin',
              message: 'Select a plugin to remove:',
              choices: installedPlugins.map(p => ({
                name: `${p.id} - ${p.description}`,
                value: p.id
              }))
            }
          ])

          selectedPlugin = plugin
        } else {
          selectedPlugin = pluginName
        }

        // Find the plugin
        const plugin = installedPlugins.find(p => p.id === selectedPlugin)
        if (!plugin) {
          logger.error(`❌ Plugin '${selectedPlugin}' is not installed`)
          return
        }

        // Confirm removal
        if (!options.yes) {
          logger.subheader(`🗑️  Plugin: ${plugin.id}`)
          logger.listItem(`Description: ${plugin.description}`)
          
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Remove this plugin?',
              default: false
            }
          ])

          if (!confirm) {
            logger.info('❌ Removal cancelled')
            return
          }
        }

        // Remove plugin
        logger.info(`🗑️  Removing plugin: ${plugin.id}`)
        await manager.uninstallPlugin(plugin.id)

        logger.success(`✅ Plugin '${plugin.id}' removed successfully`)

      } catch (error) {
        logger.error(`❌ Failed to remove plugin: ${(error as Error).message}`)
        process.exit(1)
      }
    })
}

/**
 * List plugins command
 */
function createListCommand(): Command {
  return new Command('list')
    .description('List installed and available plugins')
    .option('-a, --available', 'Show available plugins')
    .option('-i, --installed', 'Show only installed plugins')
    .option('--json', 'Output as JSON')
    .alias('ls')
    .action(async (options) => {
      try {
        const projectRoot = process.cwd()
        const manager = new CliPluginManager(projectRoot)

        if (options.json) {
          const result: any = {}

          if (!options.available) {
            result.installed = await manager.getInstalledPlugins()
          }

          if (!options.installed) {
            result.available = await getAvailablePlugins(manager)
          }

          console.log(JSON.stringify(result, null, 2))
          return
        }

        // Show installed plugins
        if (!options.available) {
          const installedPlugins = await manager.getInstalledPlugins()
          
          logger.header('📦 Installed Plugins')
          
          if (installedPlugins.length === 0) {
            logger.info('ℹ️  No plugins installed')
          } else {
            for (const plugin of installedPlugins) {
              logger.subheader(`${plugin.id}`)
              logger.listItem(`Description: ${plugin.description}`)
              logger.listItem(`Category: ${plugin.category}`)
              logger.newLine()
            }
          }
        }

        // Show available plugins
        if (!options.installed) {
          const availablePlugins = await getAvailablePlugins(manager)
          
          logger.header('🌟 Available Plugins')
          
          if (availablePlugins.length === 0) {
            logger.info('ℹ️  No additional plugins available')
          } else {
            for (const plugin of availablePlugins) {
              logger.subheader(`${plugin.id}`)
              logger.listItem(`Description: ${plugin.description}`)
              logger.listItem(`Category: ${plugin.category}`)
              logger.newLine()
            }
          }
        }

      } catch (error) {
        logger.error(`❌ Failed to list plugins: ${(error as Error).message}`)
        process.exit(1)
      }
    })
}

/**
 * Update plugins command
 */
function createUpdateCommand(): Command {
  return new Command('update')
    .description('Update installed plugins')
    .argument('[plugin]', 'Plugin name (update all if not specified)')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (pluginName: string | undefined, options) => {
      try {
        const projectRoot = process.cwd()
        const manager = new CliPluginManager(projectRoot)

        if (!await isG1Project(projectRoot)) {
          logger.error('❌ Not in a G1 project directory')
          process.exit(1)
        }

        const installedPlugins = await manager.getInstalledPlugins()
        
        if (installedPlugins.length === 0) {
          logger.info('ℹ️  No plugins installed')
          return
        }

        let pluginsToUpdate: CliPlugin[]

        if (pluginName) {
          const plugin = installedPlugins.find(p => p.id === pluginName)
          if (!plugin) {
            logger.error(`❌ Plugin '${pluginName}' is not installed`)
            return
          }
          pluginsToUpdate = [plugin]
        } else {
          pluginsToUpdate = installedPlugins
        }

        // Confirm update
        if (!options.yes) {
          logger.subheader('🔄 Plugins to update:')
          for (const plugin of pluginsToUpdate) {
            logger.listItem(`${plugin.id} - ${plugin.description}`)
          }
          
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Update these plugins?',
              default: true
            }
          ])

          if (!confirm) {
            logger.info('❌ Update cancelled')
            return
          }
        }

        // Update plugins
        for (const plugin of pluginsToUpdate) {
          logger.info(`🔄 Updating plugin: ${plugin.id}`)
          await manager.updatePlugin(plugin.id)
        }

        logger.success(`✅ Updated ${pluginsToUpdate.length} plugin(s)`)

      } catch (error) {
        logger.error(`❌ Failed to update plugins: ${(error as Error).message}`)
        process.exit(1)
      }
    })
}

/**
 * Configure plugin command
 */
function createConfigureCommand(): Command {
  return new Command('configure')
    .description('Configure an installed plugin')
    .argument('[plugin]', 'Plugin name')
    .alias('config')
    .action(async (pluginName: string | undefined) => {
      try {
        const projectRoot = process.cwd()
        const manager = new CliPluginManager(projectRoot)

        if (!await isG1Project(projectRoot)) {
          logger.error('❌ Not in a G1 project directory')
          process.exit(1)
        }

        const installedPlugins = await manager.getInstalledPlugins()
        
        if (installedPlugins.length === 0) {
          logger.info('ℹ️  No plugins installed')
          return
        }

        let selectedPlugin: CliPlugin

        if (!pluginName) {
          const { plugin } = await inquirer.prompt([
            {
              type: 'list',
              name: 'plugin',
              message: 'Select a plugin to configure:',
              choices: installedPlugins.map(p => ({
                name: `${p.id} - ${p.description}`,
                value: p.id
              }))
            }
          ])

          selectedPlugin = installedPlugins.find(p => p.id === plugin)!
        } else {
          const plugin = installedPlugins.find(p => p.id === pluginName)
          if (!plugin) {
            logger.error(`❌ Plugin '${pluginName}' is not installed`)
            return
          }
          selectedPlugin = plugin
        }

        await configurePlugin(selectedPlugin, manager)

      } catch (error) {
        logger.error(`❌ Failed to configure plugin: ${(error as Error).message}`)
        process.exit(1)
      }
    })
}

/**
 * Plugin info command
 */
function createInfoCommand(): Command {
  return new Command('info')
    .description('Show detailed information about a plugin')
    .argument('<plugin>', 'Plugin name')
    .option('--json', 'Output as JSON')
    .action(async (pluginName: string, options) => {
      try {
        const projectRoot = process.cwd()
        const manager = new CliPluginManager(projectRoot)

        const plugin = await findPlugin(pluginName, manager)
        if (!plugin) {
          logger.error(`❌ Plugin '${pluginName}' not found`)
          process.exit(1)
        }

        if (options.json) {
          console.log(JSON.stringify(plugin, null, 2))
          return
        }

        logger.header(`📋 Plugin Information: ${plugin.id}`)
        logger.subheader('Basic Info:')
        logger.listItem(`ID: ${plugin.id}`)
        logger.listItem(`Description: ${plugin.description}`)
        logger.listItem(`Category: ${plugin.category}`)

        if (plugin.config && Object.keys(plugin.config).length > 0) {
          logger.subheader('Configuration Options:')
          for (const [key, config] of Object.entries(plugin.config)) {
            logger.listItem(`${key}: ${config.description} (default: ${config.default})`)
          }
        }

      } catch (error) {
        logger.error(`❌ Failed to get plugin info: ${(error as Error).message}`)
        process.exit(1)
      }
    })
}

/**
 * Helper functions
 */

async function isG1Project(projectRoot: string): Promise<boolean> {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json')
    if (!await fs.pathExists(packageJsonPath)) {
      return false
    }

    const packageJson = await fs.readJson(packageJsonPath)
    return packageJson.dependencies?.['@g-1/core'] || packageJson.devDependencies?.['@g-1/core']
  } catch {
    return false
  }
}

async function getAvailablePlugins(manager: CliPluginManager): Promise<CliPlugin[]> {
  const installedPlugins = await manager.getInstalledPlugins()
  const installedIds = new Set(installedPlugins.map(p => p.id))
  
  // Return builtin plugins that aren't installed
  return builtinPlugins.filter(plugin => !installedIds.has(plugin.id))
}

async function findPlugin(pluginName: string, manager: CliPluginManager): Promise<CliPlugin | null> {
  // Check installed plugins first
  const installedPlugins = await manager.getInstalledPlugins()
  const installed = installedPlugins.find(p => p.id === pluginName)
  if (installed) return installed

  // Check builtin plugins
  const builtin = builtinPlugins.find(p => p.id === pluginName)
  if (builtin) return builtin

  return null
}

async function configurePlugin(plugin: CliPlugin, manager: CliPluginManager): Promise<void> {
  if (!plugin.config || Object.keys(plugin.config).length === 0) {
    logger.info(`ℹ️  Plugin '${plugin.id}' has no configuration options`)
    return
  }

  logger.subheader(`⚙️  Configuring plugin: ${plugin.id}`)

  const prompts = []
  for (const [key, config] of Object.entries(plugin.config)) {
    if (config.type === 'boolean') {
      prompts.push({
        type: 'confirm',
        name: key,
        message: config.description,
        default: config.default
      })
    } else if (config.type === 'select' && config.options) {
      prompts.push({
        type: 'list',
        name: key,
        message: config.description,
        choices: config.options,
        default: config.default
      })
    } else if (config.type === 'number') {
      prompts.push({
        type: 'number',
        name: key,
        message: config.description,
        default: config.default
      })
    } else {
      prompts.push({
        type: 'input',
        name: key,
        message: config.description,
        default: config.default
      })
    }
  }

  const answers = await inquirer.prompt(prompts)
  
  // Apply configuration
  await manager.configurePlugin(plugin.id, answers)
  
  logger.success(`✅ Plugin '${plugin.id}' configured successfully`)
}

export default createPluginCommand