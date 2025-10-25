import { PluginRegistry, PluginExecutor, PluginContext } from '@g-1/core'
import { PluginConfigValue, PluginConfigField } from '@g-1/core'
import inquirer from 'inquirer'
import type { CliPlugin, ProjectConfig } from '@g-1/core'
import { PluginContextImpl, builtinPlugins } from '@g-1/core'
import { logger } from '../utils/logger.js'

export interface PluginSelectionResult {
  selectedPlugins: string[]
  pluginConfigs: Record<string, Record<string, PluginConfigValue>>
}

export class CliPluginManager {
  private registry: PluginRegistry
  private executor: PluginExecutor

  constructor() {
    this.registry = new PluginRegistry()
    this.executor = new PluginExecutor()
    
    // Register built-in plugins
    builtinPlugins.forEach(plugin => {
      this.registry.register(plugin)
    })
  }

  /**
   * Get all available plugins
   */
  getAvailablePlugins(): CliPlugin[] {
    return this.registry.list()
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory(category: string): CliPlugin[] {
    return this.registry.list().filter(plugin => plugin.category === category)
  }

  /**
   * Interactive plugin selection and configuration
   */
  async selectAndConfigurePlugins(projectConfig: ProjectConfig): Promise<PluginSelectionResult> {
    const availablePlugins = this.getAvailablePlugins()
    
    if (availablePlugins.length === 0) {
      return { selectedPlugins: [], pluginConfigs: {} }
    }

    logger.subheader('🔌 Available Plugins')
    
    // Show plugin selection
    const { selectedPluginIds } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedPluginIds',
        message: 'Select plugins to include in your project:',
        choices: availablePlugins.map(plugin => ({
          name: `${plugin.id} - ${plugin.description}`,
          value: plugin.id,
          checked: false
        })),
        pageSize: 10
      }
    ])

    if (selectedPluginIds.length === 0) {
      return { selectedPlugins: [], pluginConfigs: {} }
    }

    // Configure each selected plugin
    const pluginConfigs: Record<string, Record<string, PluginConfigValue>> = {}
    
    for (const pluginId of selectedPluginIds) {
      const plugin = this.registry.get(pluginId)
      if (!plugin) continue

      logger.subheader(`⚙️  Configuring ${plugin.id}`)
      
      const config = await this.configurePlugin(plugin, projectConfig)
      if (Object.keys(config).length > 0) {
        pluginConfigs[pluginId] = config
      }
    }

    return {
      selectedPlugins: selectedPluginIds,
      pluginConfigs
    }
  }

  /**
   * Configure a single plugin interactively
   */
  private async configurePlugin(
    plugin: CliPlugin, 
    projectConfig: ProjectConfig
  ): Promise<Record<string, PluginConfigValue>> {
    const config: Record<string, PluginConfigValue> = {}
    const configSchema = plugin.config || {}
    
    const prompts = []
    
    for (const [key, field] of Object.entries(configSchema)) {
      const typedField = field as PluginConfigField
      let defaultValue = typedField.default
      
      // Replace template variables in default values
      if (typeof defaultValue === 'string') {
        defaultValue = defaultValue.replace(/{{projectName}}/g, projectConfig.projectName)
      }

      switch (typedField.type) {
        case 'string':
          prompts.push({
            type: 'input',
            name: key,
            message: typedField.description,
            default: defaultValue,
            validate: (input: string) => {
              if (typedField.required && !input.trim()) {
                return 'This field is required'
              }
              return true
            }
          })
          break

        case 'boolean':
          prompts.push({
            type: 'confirm',
            name: key,
            message: typedField.description,
            default: defaultValue
          })
          break

        case 'select':
          if (typedField.options && typedField.options.length > 0) {
            prompts.push({
              type: 'list',
              name: key,
              message: typedField.description,
              choices: typedField.options.map((option: any) => ({
                name: option.name,
                value: option.value
              })),
              default: defaultValue
            })
          }
          break

        case 'multiselect':
          if (typedField.options && typedField.options.length > 0) {
            prompts.push({
              type: 'checkbox',
              name: key,
              message: typedField.description,
              choices: typedField.options.map((option: any) => ({
                name: option.name,
                value: option.value,
                checked: Array.isArray(defaultValue) && defaultValue.includes(option.value)
              }))
            })
          }
          break
      }
    }

    if (prompts.length > 0) {
      const answers = await inquirer.prompt(prompts)
      Object.assign(config, answers)
    }

    return config
  }

  /**
   * Execute plugins for project creation
   */
  async executePlugins(
    selectedPlugins: string[],
    pluginConfigs: Record<string, Record<string, PluginConfigValue>>,
    projectConfig: ProjectConfig,
    projectPath: string
  ): Promise<void> {
    if (selectedPlugins.length === 0) {
      return
    }

    logger.subheader('🔧 Applying Plugins')

    // Get plugin instances from IDs
    const plugins = selectedPlugins.map(id => {
      const plugin = this.registry.get(id)
      if (!plugin) {
        throw new Error(`Plugin not found: ${id}`)
      }
      return plugin
    })

    const context = new PluginContextImpl(projectConfig, projectPath)

    try {
      const result = await this.executor.execute(plugins, context, pluginConfigs)
      
      if (result.success) {
        logger.success(`✅ Successfully applied ${plugins.length} plugin(s)`)
        
        // Log any collected dependencies
        const deps = context.getDependencies()
        if (deps.production.length > 0) {
          logger.info(`📦 Added dependencies: ${deps.production.join(', ')}`)
        }
        if (deps.development.length > 0) {
          logger.info(`🔧 Added dev dependencies: ${deps.development.join(', ')}`)
        }
      } else {
        logger.error('❌ Plugin execution failed:')
        result.errors.forEach((error: any) => {
          logger.error(`  - ${error.plugin}: ${error.message}`)
        })
      }
    } catch (error: any) {
      logger.error(`Failed to execute plugins: ${error instanceof Error ? error.message : 'Unknown error'}`)
      throw error
    }
  }

  /**
   * Parse CLI plugin options
   */
  parseCliOptions(options: Record<string, any>): PluginSelectionResult {
    const selectedPlugins: string[] = []
    const pluginConfigs: Record<string, Record<string, PluginConfigValue>> = {}

    // Check for plugin flags
    const availablePlugins = this.getAvailablePlugins()
    
    for (const plugin of availablePlugins) {
      const pluginFlag = options[plugin.id]
      
      if (pluginFlag === true) {
        selectedPlugins.push(plugin.id)
        
        // Look for plugin-specific configuration options
        const config: Record<string, PluginConfigValue> = {}
        const configSchema = plugin.config || {}
        
        for (const [key, field] of Object.entries(configSchema)) {
          const typedField = field as PluginConfigField
          const optionKey = `${plugin.id}${key.charAt(0).toUpperCase()}${key.slice(1)}`
          if (options[optionKey] !== undefined) {
            config[key] = options[optionKey]
          }
        }
        
        if (Object.keys(config).length > 0) {
          pluginConfigs[plugin.id] = config
        }
      }
    }

    return { selectedPlugins, pluginConfigs }
  }
}