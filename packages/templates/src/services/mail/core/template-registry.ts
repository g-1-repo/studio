import type { EmailTemplate } from '../interfaces/email-template.interface'
import type { TemplateConfig } from './template-config.interface'

export type TemplateFactory<T extends unknown[] = unknown[]> = (
  config: TemplateConfig,
  ...args: T
) => EmailTemplate

export class TemplateRegistry {
  private templates = new Map<string, TemplateFactory<any>>()
  private cache = new Map<string, EmailTemplate>()

  register<T extends unknown[]>(name: string, factory: TemplateFactory<T>): void {
    this.templates.set(name, factory as TemplateFactory<any>)
  }

  create<T extends unknown[]>(name: string, config: TemplateConfig, ...args: T): EmailTemplate {
    const factory = this.templates.get(name)
    if (!factory) {
      throw new Error(`Template "${name}" not found`)
    }

    // Create cache key from template name and arguments
    const cacheKey = this.createCacheKey(name, config, args)

    // Return cached template if available
    if (this.cache.has(cacheKey)) {
      const cachedTemplate = this.cache.get(cacheKey)
      if (cachedTemplate) {
        return cachedTemplate
      }
    }

    // Create new template and cache it
    const template = factory(config, ...args)
    this.cache.set(cacheKey, template)

    return template
  }

  has(name: string): boolean {
    return this.templates.has(name)
  }

  list(): string[] {
    return Array.from(this.templates.keys())
  }

  clearCache(): void {
    this.cache.clear()
  }

  private createCacheKey(name: string, config: TemplateConfig, args: unknown[]): string {
    // Simple cache key based on template name and serialized args
    // In production, you might want a more sophisticated cache key strategy
    const argsHash = JSON.stringify(args)
    const configHash = JSON.stringify(config)
    return `${name}:${configHash}:${argsHash}`
  }
}

// Global registry instance
export const templateRegistry = new TemplateRegistry()
