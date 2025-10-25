import type { CliPlugin, PluginConfigValue, PluginContext, PluginExecutionResult } from './types.js'

export class PluginExecutor {
  /**
   * Execute plugins in dependency order
   */
  async execute(
    plugins: CliPlugin[],
    context: PluginContext,
    configs: Record<string, Record<string, PluginConfigValue>> = {}
  ): Promise<PluginExecutionResult> {
    const result: PluginExecutionResult = {
      success: true,
      errors: [],
    }

    try {
      // Sort plugins by dependencies
      const sortedPlugins = this.sortPluginsByDependencies(plugins)

      // Execute prepare phase
      for (const plugin of sortedPlugins) {
        try {
          const config = configs[plugin.id] || {}
          if (plugin.prepare) {
            await plugin.prepare(context, config)
          }
        } catch (error: unknown) {
          result.success = false
          result.errors.push({
            plugin: plugin.id,
            phase: 'prepare',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Execute apply phase
      for (const plugin of sortedPlugins) {
        try {
          const config = configs[plugin.id] || {}
          await plugin.apply(context, config)
        } catch (error: unknown) {
          result.success = false
          result.errors.push({
            plugin: plugin.id,
            phase: 'apply',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }

      // Execute finalize phase
      for (const plugin of sortedPlugins) {
        try {
          const config = configs[plugin.id] || {}
          if (plugin.finalize) {
            await plugin.finalize(context, config)
          }
        } catch (error: unknown) {
          result.success = false
          result.errors.push({
            plugin: plugin.id,
            phase: 'finalize',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    } catch (error: unknown) {
      result.success = false
      result.errors.push({
        plugin: 'executor',
        phase: 'execution',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    return result
  }

  /**
   * Sort plugins by their dependencies
   */
  private sortPluginsByDependencies(plugins: CliPlugin[]): CliPlugin[] {
    const pluginMap = new Map<string, CliPlugin>()
    const visited = new Set<string>()
    const visiting = new Set<string>()
    const sorted: CliPlugin[] = []

    // Create plugin map
    plugins.forEach(plugin => {
      pluginMap.set(plugin.id, plugin)
    })

    const visit = (pluginId: string): void => {
      if (visited.has(pluginId)) {
        return
      }

      if (visiting.has(pluginId)) {
        throw new Error(`Circular dependency detected involving plugin: ${pluginId}`)
      }

      const plugin = pluginMap.get(pluginId)
      if (!plugin) {
        throw new Error(`Plugin not found: ${pluginId}`)
      }

      visiting.add(pluginId)

      // Visit dependencies first
      if (plugin.dependencies) {
        plugin.dependencies.forEach((dep: string) => {
          if (pluginMap.has(dep)) {
            visit(dep)
          }
        })
      }

      visiting.delete(pluginId)
      visited.add(pluginId)
      sorted.push(plugin)
    }

    // Visit all plugins
    plugins.forEach(plugin => {
      if (!visited.has(plugin.id)) {
        visit(plugin.id)
      }
    })

    return sorted
  }
}
