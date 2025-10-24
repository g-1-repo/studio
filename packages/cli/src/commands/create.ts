import path from 'node:path'
import { Command } from 'commander'
import inquirer from 'inquirer'
import { logger } from '../utils/logger.js'
import { validateProjectName } from '../utils/validation.js'
import { createProject } from '../generators/project.js'
import type { CreateProjectOptions } from '../types/index.js'

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
      const nameValidation = validateProjectName(projectName!)
      if (!nameValidation.valid) {
        logger.error(nameValidation.message)
        process.exit(1)
      }

      // Get additional options through prompts if not provided
      const templateChoices = [
        { name: 'API Server - Full-featured API with auth, database, and middleware', value: 'api' },
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

      // Merge options with answers
      const createOptions: CreateProjectOptions = {
        name: projectName!,
        template: answers.template || options.template,
        directory: options.directory || process.cwd(),
        packageManager: answers.packageManager || options.packageManager,
        git: options.git,
        install: options.install,
        typescript: options.typescript,
        eslint: options.eslint,
        prettier: options.prettier,
      }

      // Show configuration summary
      logger.subheader('📋 Project Configuration')
      logger.table([
        { key: 'Project Name', value: createOptions.name },
        { key: 'Template', value: createOptions.template },
        { key: 'Directory', value: path.resolve(createOptions.directory!, createOptions.name) },
        { key: 'Package Manager', value: createOptions.packageManager! },
        { key: 'TypeScript', value: createOptions.typescript ? 'Yes' : 'No' },
        { key: 'ESLint', value: createOptions.eslint ? 'Yes' : 'No' },
        { key: 'Prettier', value: createOptions.prettier ? 'Yes' : 'No' },
        { key: 'Git Init', value: createOptions.git ? 'Yes' : 'No' },
        { key: 'Install Dependencies', value: createOptions.install ? 'Yes' : 'No' },
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
      const projectPath = path.resolve(createOptions.directory!, createOptions.name)
      const relativeProjectPath = path.relative(process.cwd(), projectPath)

      logger.listItem(`cd ${relativeProjectPath}`)

      if (!createOptions.install) {
        logger.listItem(`${createOptions.packageManager} install`)
      }

      logger.listItem(`${createOptions.packageManager} run dev`)
      logger.newLine()

      logger.info('Happy coding! 🎯')
    }
    catch (error) {
      logger.error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
  })
