import path from 'node:path'
import type { CliPlugin, PluginConfigField, PluginConfigValue, ProjectConfig } from '@g-1/core'
import { builtinPlugins, PluginContextImpl, PluginExecutor, PluginRegistry } from '@g-1/core'
import fs from 'fs-extra'
import inquirer from 'inquirer'
import { logger } from '../utils/logger.js'

export interface PluginSelectionResult {
  selectedPlugins: string[]
  pluginConfigs: Record<string, Record<string, PluginConfigValue>>
}

export interface PluginInstallOptions {
  dev?: boolean
  force?: boolean
}

export class CliPluginManager {
  private registry: PluginRegistry
  private executor: PluginExecutor
  private projectRoot: string
  private configPath: string
  private packageJsonPath: string

  constructor(projectRoot?: string) {
    this.registry = new PluginRegistry()
    this.executor = new PluginExecutor()
    this.projectRoot = projectRoot || process.cwd()
    this.configPath = path.join(this.projectRoot, 'g1.config.json')
    this.packageJsonPath = path.join(this.projectRoot, 'package.json')

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
          checked: false,
        })),
        pageSize: 10,
      },
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

      const config = await this.configurePluginInteractively(plugin, projectConfig)
      if (Object.keys(config).length > 0) {
        pluginConfigs[pluginId] = config
      }
    }

    return {
      selectedPlugins: selectedPluginIds,
      pluginConfigs,
    }
  }

  /**
   * Configure a single plugin interactively
   */
  private async configurePluginInteractively(
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
            },
          })
          break

        case 'boolean':
          prompts.push({
            type: 'confirm',
            name: key,
            message: typedField.description,
            default: defaultValue,
          })
          break

        case 'select':
          if (typedField.options && typedField.options.length > 0) {
            prompts.push({
              type: 'list',
              name: key,
              message: typedField.description,
              choices: typedField.options.map(
                (option: string | { name: string; value: PluginConfigValue }) => {
                  if (typeof option === 'string') {
                    return { name: option, value: option }
                  }
                  return {
                    name: option.name,
                    value: option.value,
                  }
                }
              ),
              default: defaultValue,
            })
          }
          break

        case 'multiselect':
          if (typedField.options && typedField.options.length > 0) {
            prompts.push({
              type: 'checkbox',
              name: key,
              message: typedField.description,
              choices: typedField.options.map(
                (option: string | { name: string; value: PluginConfigValue }) => {
                  if (typeof option === 'string') {
                    return {
                      name: option,
                      value: option,
                      checked: Array.isArray(defaultValue) && defaultValue.includes(option),
                    }
                  }
                  return {
                    name: option.name,
                    value: option.value,
                    checked: Array.isArray(defaultValue) && defaultValue.includes(option.value as string),
                  }
                }
              ),
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
        result.errors.forEach((error: { plugin: string; phase: string; message: string }) => {
          logger.error(`  - ${error.plugin}: ${error.message}`)
        })
      }
    } catch (error: unknown) {
      logger.error(
        `Failed to execute plugins: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      throw error
    }
  }

  /**
   * Parse CLI plugin options
   */
  parseCliOptions(options: Record<string, unknown>): PluginSelectionResult {
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
          const _typedField = field as PluginConfigField
          const optionKey = `${plugin.id}${key.charAt(0).toUpperCase()}${key.slice(1)}`
          if (options[optionKey] !== undefined) {
            config[key] = options[optionKey] as PluginConfigValue
          }
        }

        if (Object.keys(config).length > 0) {
          pluginConfigs[plugin.id] = config
        }
      }
    }

    return { selectedPlugins, pluginConfigs }
  }

  /**
   * Get installed plugins from project config
   */
  async getInstalledPlugins(): Promise<CliPlugin[]> {
    try {
      const config = await this.getProjectConfig()
      const installedPluginIds = Object.keys(config.plugins || {})

      return this.registry.list().filter(plugin => installedPluginIds.includes(plugin.id))
    } catch (error) {
      logger.debug(`Failed to get installed plugins: ${(error as Error).message}`)
      return []
    }
  }

  /**
   * Install a plugin
   */
  async installPlugin(pluginId: string, options: PluginInstallOptions = {}): Promise<void> {
    // Find the plugin
    const plugin = this.registry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`)
    }

    // Check if already installed
    const config = await this.getProjectConfig()
    if (config.plugins?.[pluginId] && !options.force) {
      throw new Error(`Plugin '${pluginId}' is already installed`)
    }

    // Install dependencies if needed
    if (plugin.prepare) {
      logger.info(`📦 Installing dependencies for ${pluginId}...`)
      const context = new PluginContextImpl(
        {
          projectName: 'temp',
          basepath: this.projectRoot,
          packageManager: 'bun',
          typescript: true,
          git: false,
          install: false,
          eslint: false,
          prettier: false,
        },
        this.projectRoot
      )
      await plugin.prepare(context, {})
    }

    // Add to project config with default configuration
    const defaultConfig: Record<string, PluginConfigValue> = {}
    if (plugin.config) {
      for (const [key, configDef] of Object.entries(plugin.config)) {
        defaultConfig[key] = configDef.default ?? ''
      }
    }

    config.plugins = config.plugins || {}
    config.plugins[pluginId] = defaultConfig

    await this.saveProjectConfig(config)

    // Apply the plugin
    await this.applyPlugin(plugin, defaultConfig)
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const config = await this.getProjectConfig()

    if (!config.plugins?.[pluginId]) {
      throw new Error(`Plugin '${pluginId}' is not installed`)
    }

    // Remove from config
    delete config.plugins[pluginId]
    await this.saveProjectConfig(config)

    // Clean up generated files (basic cleanup)
    const generatedFiles = [
      path.join(this.projectRoot, 'src', `${pluginId}.middleware.ts`),
      path.join(this.projectRoot, 'src', `${pluginId}.plugin.ts`),
    ]

    for (const file of generatedFiles) {
      if (await fs.pathExists(file)) {
        await fs.remove(file)
        logger.debug(`Removed generated file: ${file}`)
      }
    }
  }

  /**
   * Update a plugin
   */
  async updatePlugin(pluginId: string): Promise<void> {
    const config = await this.getProjectConfig()

    if (!config.plugins?.[pluginId]) {
      throw new Error(`Plugin '${pluginId}' is not installed`)
    }

    const plugin = this.registry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`)
    }

    // Re-apply the plugin with current config
    await this.applyPlugin(plugin, config.plugins[pluginId])
  }

  /**
   * Configure a plugin
   */
  async configurePlugin(
    pluginId: string,
    newConfig: Record<string, PluginConfigValue>
  ): Promise<void> {
    const config = await this.getProjectConfig()

    if (!config.plugins?.[pluginId]) {
      throw new Error(`Plugin '${pluginId}' is not installed`)
    }

    const plugin = this.registry.get(pluginId)
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`)
    }

    // Update config
    config.plugins[pluginId] = { ...config.plugins[pluginId], ...newConfig }
    await this.saveProjectConfig(config)

    // Re-apply the plugin with new config
    await this.applyPlugin(plugin, config.plugins[pluginId])
  }

  /**
   * Apply a plugin with given configuration
   */
  private async applyPlugin(
    plugin: CliPlugin,
    config: Record<string, PluginConfigValue>
  ): Promise<void> {
    if (!plugin.apply) {
      return
    }

    logger.info(`🔧 Applying plugin: ${plugin.id}`)

    const context = new PluginContextImpl(
      {
        projectName: 'temp',
        basepath: this.projectRoot,
        packageManager: 'bun',
        typescript: true,
        git: false,
        install: false,
        eslint: false,
        prettier: false,
      },
      this.projectRoot
    )

    await plugin.apply(context, config)
  }

  /**
   * Get project configuration
   */
  private async getProjectConfig(): Promise<ProjectConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        return await fs.readJson(this.configPath)
      }
    } catch (error) {
      logger.debug(`Failed to read project config: ${(error as Error).message}`)
    }

    return {
      projectName: 'default',
      basepath: this.projectRoot,
      packageManager: 'bun',
      typescript: true,
      git: false,
      install: false,
      eslint: false,
      prettier: false,
      plugins: {},
    }
  }

  /**
   * Save project configuration
   */
  private async saveProjectConfig(config: ProjectConfig): Promise<void> {
    await fs.writeJson(this.configPath, config, { spaces: 2 })
  }

  /**
   * Write a file
   */
  private async writeFile(filePath: string, content: string): Promise<void> {
    const fullPath = path.resolve(this.projectRoot, filePath)
    await fs.ensureDir(path.dirname(fullPath))
    await fs.writeFile(fullPath, content, 'utf-8')
    logger.debug(`Wrote file: ${filePath}`)
  }

  /**
   * Read a file
   */
  private async readFile(filePath: string): Promise<string> {
    const fullPath = path.resolve(this.projectRoot, filePath)
    return await fs.readFile(fullPath, 'utf-8')
  }
}
