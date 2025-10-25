/**
 * Core plugin system types for the G1 API Framework
 */

export type PluginConfigValue = string | number | boolean | string[]

export type PluginCategory = 'feature' | 'service' | 'deployment' | 'middleware'

export interface PluginConfigField {
  type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect'
  description?: string
  default?: PluginConfigValue
  options?: string[] | { name: string; value: PluginConfigValue }[]
  required?: boolean
  validate?: (value: PluginConfigValue) => boolean | string
}

export interface PluginConfigSchema {
  [key: string]: PluginConfigField
}

export interface PluginContext {
  readonly config: ProjectConfig
  readonly projectPath: string

  // File operations
  addFile(relativePath: string, content: string): Promise<void>
  modifyFile(relativePath: string, modifier: (content: string) => string): Promise<void>
  readFile(relativePath: string): Promise<string>
  fileExists(relativePath: string): Promise<boolean>

  // Dependency management
  addDependency(packageName: string, version?: string): void
  addDevDependency(packageName: string, version?: string): void
  getDependencies(): { production: string[]; development: string[] }

  // Template processing
  replaceTemplateVariables(content: string, variables?: Record<string, PluginConfigValue>): string
}

export interface ProjectConfig {
  projectName: string
  basepath: string
  template?: string
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
  typescript: boolean
  git: boolean
  install: boolean
  eslint: boolean
  prettier: boolean
  plugins?: Record<string, Record<string, PluginConfigValue>>
}

export interface CliPlugin {
  /** Unique plugin identifier */
  id: string
  /** Plugin category for organization */
  category: PluginCategory
  /** Human-readable description */
  description: string
  /** Configuration schema for this plugin */
  config?: PluginConfigSchema
  /** Plugin dependencies (other plugin IDs that must be enabled) */
  dependencies?: string[]
  /** Plugins that conflict with this one */
  conflicts?: string[]

  /**
   * Prepare phase - called before applying plugins
   * Use this to add dependencies, validate configuration, etc.
   */
  prepare?(ctx: PluginContext, config: Record<string, PluginConfigValue>): void | Promise<void>

  /**
   * Apply phase - called during project generation
   * Use this to generate files, modify existing files, etc.
   */
  apply(ctx: PluginContext, config: Record<string, PluginConfigValue>): void | Promise<void>

  /**
   * Finalize phase - called after all plugins have applied
   * Use this for cleanup, final modifications, etc.
   */
  finalize?(ctx: PluginContext, config: Record<string, PluginConfigValue>): void | Promise<void>
}

export interface PluginExecutionResult {
  success: boolean
  errors: Array<{
    plugin: string
    phase: string
    message: string
  }>
}

export interface PluginValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
