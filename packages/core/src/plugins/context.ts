import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import type { PluginContext, ProjectConfig, PluginConfigValue } from './types.js'

export class PluginContextImpl implements PluginContext {
  private files: Map<string, string> = new Map()
  private dependencies: { production: string[]; development: string[] } = {
    production: [],
    development: []
  }

  constructor(
    public readonly config: ProjectConfig,
    public readonly projectPath: string
  ) {}

  /**
   * Add a new file to the project
   */
  async addFile(relativePath: string, content: string): Promise<void> {
    const fullPath = path.join(this.projectPath, relativePath)
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    
    // Store in memory for potential template processing
    this.files.set(relativePath, content)
    
    // Write to disk
    await fs.writeFile(fullPath, content, 'utf-8')
  }

  /**
   * Modify existing file content
   */
  async modifyFile(relativePath: string, modifier: (content: string) => string): Promise<void> {
    const fullPath = path.join(this.projectPath, relativePath)
    
    let content: string
    
    // Check if file exists in memory first
    if (this.files.has(relativePath)) {
      content = this.files.get(relativePath)!
    } else {
      try {
        content = await fs.readFile(fullPath, 'utf-8')
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
          throw new Error(`File not found: ${relativePath}`)
        }
        throw error
      }
    }
    
    // Apply modification
    const modifiedContent = modifier(content)
    
    // Update memory and disk
    this.files.set(relativePath, modifiedContent)
    await fs.writeFile(fullPath, modifiedContent, 'utf-8')
  }

  /**
   * Read file content
   */
  async readFile(relativePath: string): Promise<string> {
    // Check memory first
    if (this.files.has(relativePath)) {
      return this.files.get(relativePath)!
    }
    
    // Read from disk
    const fullPath = path.join(this.projectPath, relativePath)
    try {
      const content = await fs.readFile(fullPath, 'utf-8')
      this.files.set(relativePath, content)
      return content
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${relativePath}`)
      }
      throw error
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(relativePath: string): Promise<boolean> {
    // Check memory first
    if (this.files.has(relativePath)) {
      return true
    }
    
    // Check disk
    const fullPath = path.join(this.projectPath, relativePath)
    try {
      await fs.access(fullPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Add production dependency
   */
  addDependency(packageName: string, version?: string): void {
    const dep = version ? `${packageName}@${version}` : packageName
    if (!this.dependencies.production.includes(dep)) {
      this.dependencies.production.push(dep)
    }
  }

  /**
   * Add development dependency
   */
  addDevDependency(packageName: string, version?: string): void {
    const dep = version ? `${packageName}@${version}` : packageName
    if (!this.dependencies.development.includes(dep)) {
      this.dependencies.development.push(dep)
    }
  }

  /**
   * Get collected dependencies
   */
  getDependencies(): { production: string[]; development: string[] } {
    return {
      production: [...this.dependencies.production],
      development: [...this.dependencies.development]
    }
  }

  /**
   * Replace template variables in content
   */
  replaceTemplateVariables(content: string, variables?: Record<string, PluginConfigValue>): string {
    let result = content
    
    // Replace built-in variables
    result = result.replace(/{{projectName}}/g, this.config.projectName)
    result = result.replace(/{{packageManager}}/g, this.config.packageManager || 'npm')
    
    // Replace custom variables
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        result = result.replace(regex, String(value))
      }
    }
    
    return result
  }
}