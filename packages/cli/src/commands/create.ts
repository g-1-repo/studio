import path from 'node:path'
import type { PluginConfigValue } from '@g-1/core'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { createProject } from '../generators/project.js'
import { CliPluginManager } from '../plugins/manager.js'
import type { CreateProjectOptions } from '../types/index.js'
import { logger } from '../utils/logger.js'
import { validateProjectName } from '../utils/validation.js'

export const createCommand = new Command('create')
  .description('Create a new G1 API project')
  .argument('[name]', 'Project name')
  .option('-t, --template <template>', 'Project template', 'api')
  .option('-d, --directory <directory>', 'Target directory')
  .option('--no-git', 'Skip git initialization')
  .option('--no-install', 'Skip dependency installation')
  .option('--package-manager <pm>', 'Package manager (npm, yarn, pnpm, bun)', 'bun')
  .option('--typescript', 'Use TypeScript (default: true)', true)
  .option('--no-eslint', 'Skip ESLint setup')
  .option('--no-prettier', 'Skip Prettier setup')
  .option('--openapi', 'Include OpenAPI documentation plugin')
  .option(
    '--openapi-theme <theme>',
    'OpenAPI theme (kepler, saturn, mars, moon, alternate)',
    'kepler'
  )
  .option('--openapi-title <title>', 'OpenAPI documentation title')
  .option('--no-interactive', 'Skip interactive plugin configuration')
  .action(async (projectName: string | undefined, options) => {
    try {
      logger.header('🚀 G1 API Framework Project Generator')

      // Get project name if not provided
      if (!projectName) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'What is your project name?',
            validate: (input: string) => {
              const validation = validateProjectName(input)
              return validation.valid || validation.message
            },
          },
        ])
        projectName = answers.name
      }

      // Validate project name
      if (!projectName) {
        logger.error('Project name is required')
        process.exit(1)
      }

      const nameValidation = validateProjectName(projectName)
      if (!nameValidation.valid) {
        logger.error(nameValidation.message)
        process.exit(1)
      }

      // Get additional options through prompts if not provided
      const templateChoices = [
        {
          name: 'API Server - Full-featured API with auth, database, and middleware',
          value: 'api',
        },
        { name: 'Minimal API - Basic API structure with minimal dependencies', value: 'minimal' },
        { name: 'Plugin - Create a G1 framework plugin', value: 'plugin' },
      ]

      const packageManagerChoices = [
        { name: 'Bun (recommended)', value: 'bun' },
        { name: 'npm', value: 'npm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'pnpm', value: 'pnpm' },
      ]

      const prompts = []

      if (!options.template || options.template === 'api') {
        prompts.push({
          type: 'list',
          name: 'template',
          message: 'Which template would you like to use?',
          choices: templateChoices,
          default: 'api',
        })
      }

      if (!options.packageManager) {
        prompts.push({
          type: 'list',
          name: 'packageManager',
          message: 'Which package manager would you like to use?',
          choices: packageManagerChoices,
          default: 'bun',
        })
      }

      const answers = await inquirer.prompt(prompts)

      // Initialize plugin manager
      const pluginManager = new CliPluginManager()

      // Handle plugin selection and configuration
      let pluginSelection: {
        selectedPlugins: string[]
        pluginConfigs: Record<string, Record<string, PluginConfigValue>>
      } = {
        selectedPlugins: [],
        pluginConfigs: {},
      }

      if (options.interactive !== false) {
        // Interactive mode - let user select and configure plugins
        const projectConfig = {
          projectName: projectName,
          template: answers.template || options.template,
          basepath: '/',
          packageManager: answers.packageManager || options.packageManager || 'bun',
          typescript: options.typescript,
          git: options.git,
          install: options.install,
          eslint: options.eslint,
          prettier: options.prettier,
        }

        pluginSelection = await pluginManager.selectAndConfigurePlugins(projectConfig)
      } else {
        // Non-interactive mode - parse CLI options for plugins
        pluginSelection = pluginManager.parseCliOptions(options)
      }

      // Merge options with answers
      const createOptions: CreateProjectOptions = {
        name: projectName,
        template: answers.template || options.template,
        directory: options.directory || process.cwd(),
        packageManager: answers.packageManager || options.packageManager || 'bun',
        git: options.git,
        install: options.install,
        typescript: options.typescript,
        eslint: options.eslint,
        prettier: options.prettier,
        plugins: pluginSelection.selectedPlugins,
        pluginConfigs: pluginSelection.pluginConfigs,
        interactive: options.interactive,
      }

      // Show configuration summary
      logger.subheader('📋 Project Configuration')
      const targetDirectory = createOptions.directory || process.cwd()
      const packageManager = createOptions.packageManager || 'bun'

      logger.table([
        { key: 'Project Name', value: createOptions.name },
        { key: 'Template', value: createOptions.template },
        { key: 'Directory', value: path.resolve(targetDirectory, createOptions.name) },
        { key: 'Package Manager', value: packageManager },
        { key: 'TypeScript', value: createOptions.typescript ? 'Yes' : 'No' },
        { key: 'ESLint', value: createOptions.eslint ? 'Yes' : 'No' },
        { key: 'Prettier', value: createOptions.prettier ? 'Yes' : 'No' },
        { key: 'Git Init', value: createOptions.git ? 'Yes' : 'No' },
        { key: 'Install Dependencies', value: createOptions.install ? 'Yes' : 'No' },
        {
          key: 'Plugins',
          value: createOptions.plugins?.length ? createOptions.plugins.join(', ') : 'None',
        },
      ])

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Proceed with project creation?',
          default: true,
        },
      ])

      if (!confirm) {
        logger.warn('Project creation cancelled')
        process.exit(0)
      }

      // Create the project
      await createProject(createOptions)

      logger.newLine()
      logger.success(`🎉 Project "${createOptions.name}" created successfully!`)

      // Show next steps
      logger.subheader('🚀 Next Steps')
      const projectDirectory = createOptions.directory || process.cwd()
      const projectPath = path.resolve(projectDirectory, createOptions.name)
      const relativeProjectPath = path.relative(process.cwd(), projectPath)

      logger.listItem(`cd ${relativeProjectPath}`)

      if (!createOptions.install) {
        logger.listItem(`${packageManager} install`)
      }

      logger.listItem(`${packageManager} run dev`)
      logger.newLine()

      logger.info('Happy coding! 🎯')
    } catch (error) {
      logger.error(
        `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
      process.exit(1)
    }
  })
