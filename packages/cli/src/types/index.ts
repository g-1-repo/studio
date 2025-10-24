/**
 * Project template configuration
 */
export interface ProjectTemplate {
  name: string
  description: string
  path: string
  dependencies?: string[]
  devDependencies?: string[]
  scripts?: Record<string, string>
  files?: TemplateFile[]
}

/**
 * Template file configuration
 */
export interface TemplateFile {
  source: string
  destination: string
  template?: boolean
  executable?: boolean
}

/**
 * Project creation options
 */
export interface CreateProjectOptions {
  name: string
  template: string
  directory?: string
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  git?: boolean
  install?: boolean
  typescript?: boolean
  eslint?: boolean
  prettier?: boolean
}

/**
 * Code generation options
 */
export interface GenerateOptions {
  type: 'plugin' | 'middleware' | 'route' | 'model' | 'service'
  name: string
  directory?: string
  template?: string
  overwrite?: boolean
  force?: boolean
  includeTests?: boolean
  includeDocs?: boolean
}

/**
 * Template variables for mustache rendering
 */
export interface TemplateVariables {
  projectName: string
  packageName: string
  description?: string
  author?: string
  license?: string
  typescript?: boolean
  eslint?: boolean
  prettier?: boolean
  packageManager?: string
  [key: string]: unknown
}

/**
 * CLI configuration
 */
export interface CliConfig {
  defaultTemplate: string
  defaultPackageManager: 'npm' | 'yarn' | 'pnpm' | 'bun'
  templatesPath: string
  generatorsPath: string
}

/**
 * Generator configuration
 */
export interface GeneratorConfig {
  name: string
  description: string
  prompts?: GeneratorPrompt[]
  files: GeneratorFile[]
}

/**
 * Generator prompt configuration
 */
export interface GeneratorPrompt {
  type: 'input' | 'confirm' | 'list' | 'checkbox'
  name: string
  message: string
  default?: unknown
  choices?: string[] | { name: string, value: unknown }[]
  validate?: (input: unknown) => boolean | string
}

/**
 * Generator file configuration
 */
export interface GeneratorFile {
  template: string
  destination: string
  condition?: string
}
