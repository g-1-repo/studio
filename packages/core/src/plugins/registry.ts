import type { CliPlugin, PluginCategory, PluginValidationResult } from './types.js'

/**
 * Plugin registry for managing and discovering plugins
 */
export class PluginRegistry {
    private plugins = new Map<string, CliPlugin>()

    /**
     * Register a plugin with the registry
     */
    register(plugin: CliPlugin): void {
        if (this.plugins.has(plugin.id)) {
            throw new Error(`Plugin with id '${plugin.id}' is already registered`)
        }

        // Validate plugin structure
        const validation = this.validatePlugin(plugin)
        if (!validation.valid) {
            throw new Error(`Invalid plugin '${plugin.id}': ${validation.errors.join(', ')}`)
        }

        this.plugins.set(plugin.id, plugin)
    }

    /**
     * Get a plugin by ID
     */
    get(id: string): CliPlugin | undefined {
        return this.plugins.get(id)
    }

    /**
     * Get all plugins in a category
     */
    getByCategory(category: PluginCategory): CliPlugin[] {
        return Array.from(this.plugins.values()).filter(plugin => plugin.category === category)
    }

    /**
     * Get all registered plugins
     */
    list(): CliPlugin[] {
        return Array.from(this.plugins.values())
    }

    /**
     * Get all plugin IDs
     */
    getIds(): string[] {
        return Array.from(this.plugins.keys())
    }

    /**
     * Check if a plugin is registered
     */
    has(id: string): boolean {
        return this.plugins.has(id)
    }

    /**
     * Unregister a plugin
     */
    unregister(id: string): boolean {
        return this.plugins.delete(id)
    }

    /**
     * Clear all plugins
     */
    clear(): void {
        this.plugins.clear()
    }

    /**
     * Validate plugin dependencies and conflicts
     */
    validatePluginSelection(selectedPluginIds: string[]): PluginValidationResult {
        const errors: string[] = []
        const warnings: string[] = []
        const selectedPlugins = selectedPluginIds.map(id => this.get(id)).filter(Boolean) as CliPlugin[]

        // Check if all selected plugins exist
        for (const id of selectedPluginIds) {
            if (!this.has(id)) {
                errors.push(`Plugin '${id}' not found`)
            }
        }

        // Check dependencies
        for (const plugin of selectedPlugins) {
            if (plugin.dependencies) {
                for (const depId of plugin.dependencies) {
                    if (!selectedPluginIds.includes(depId)) {
                        errors.push(`Plugin '${plugin.id}' requires '${depId}' but it's not selected`)
                    }
                }
            }
        }

        // Check conflicts
        for (const plugin of selectedPlugins) {
            if (plugin.conflicts) {
                for (const conflictId of plugin.conflicts) {
                    if (selectedPluginIds.includes(conflictId)) {
                        errors.push(`Plugin '${plugin.id}' conflicts with '${conflictId}'`)
                    }
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    /**
     * Validate a plugin structure
     */
    private validatePlugin(plugin: CliPlugin): PluginValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        // Required fields
        if (!plugin.id || typeof plugin.id !== 'string') {
            errors.push('Plugin must have a valid id')
        }

        if (!plugin.category || !['feature', 'service', 'deployment'].includes(plugin.category)) {
            errors.push('Plugin must have a valid category (feature, service, deployment)')
        }

        if (!plugin.description || typeof plugin.description !== 'string') {
            errors.push('Plugin must have a description')
        }

        if (typeof plugin.apply !== 'function') {
            errors.push('Plugin must have an apply function')
        }

        // Optional fields validation
        if (plugin.prepare && typeof plugin.prepare !== 'function') {
            errors.push('Plugin prepare must be a function if provided')
        }

        if (plugin.finalize && typeof plugin.finalize !== 'function') {
            errors.push('Plugin finalize must be a function if provided')
        }

        if (plugin.dependencies && !Array.isArray(plugin.dependencies)) {
            errors.push('Plugin dependencies must be an array if provided')
        }

        if (plugin.conflicts && !Array.isArray(plugin.conflicts)) {
            errors.push('Plugin conflicts must be an array if provided')
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }
}

// Global registry instance
export const pluginRegistry = new PluginRegistry()