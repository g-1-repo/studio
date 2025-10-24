import { Command } from 'commander'
import inquirer from 'inquirer'
import { generateMiddleware, generatePlugin, generateRoute } from '../generators/index.js'
import type { GenerateOptions } from '../types/index.js'
import { Logger } from '../utils/logger.js'
import { validateIdentifier } from '../utils/validation.js'

const logger = new Logger()

export function createGenerateCommand(): Command {
  const command = new Command('generate')
    .alias('g')
    .description('Generate code scaffolding (plugins, middleware, routes)')
    .argument('<type>', 'Type of code to generate (plugin, middleware, route)')
    .argument('[name]', 'Name of the generated code')
    .option('-d, --directory <dir>', 'Output directory', '.')
    .option('-f, --force', 'Overwrite existing files', false)
    .option('--no-tests', 'Skip test file generation')
    .option('--no-docs', 'Skip documentation generation')
    .option('--template <template>', 'Use specific template')
    .action(async (type: string, name?: string, options: Record<string, unknown> = {}) => {
      try {
        await generateCommand(type, name, options)
      } catch (error) {
        logger.error(`Generation failed: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(1)
      }
    })

  return command
}

export async function generateCommand(
  type: string,
  name?: string,
  options: Record<string, unknown> = {}
): Promise<void> {
  logger.header('🔧 G1 Code Generator')

  // Validate generator type
  const validTypes = ['plugin', 'middleware', 'route']
  if (!validTypes.includes(type)) {
    logger.error(`Invalid generator type: ${type}`)
    logger.info(`Valid types: ${validTypes.join(', ')}`)
    return
  }

  // Get name if not provided
  if (!name) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: `Enter ${type} name:`,
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Name is required'
          }
          const validation = validateIdentifier(input)
          return validation.valid || validation.message
        },
      },
    ])
    name = answers.name
  }

  // At this point, name is guaranteed to be defined
  if (!name) {
    logger.error('Name is required')
    return
  }

  // Validate name
  const nameValidation = validateIdentifier(name)
  if (!nameValidation.valid) {
    logger.error(`Invalid name: ${nameValidation.message}`)
    return
  }

  // Prepare generation options
  const generateOptions: GenerateOptions = {
    name: name,
    type: type as 'plugin' | 'middleware' | 'route' | 'model' | 'service',
    directory: options.directory as string | undefined,
    force: options.force as boolean | undefined,
    includeTests: options.tests !== false,
    includeDocs: options.docs !== false,
    template: options.template as string | undefined,
  }

  // Show configuration
  logger.subheader('Configuration:')
  logger.listItem(`Type: ${type}`)
  logger.listItem(`Name: ${name}`)
  logger.listItem(`Directory: ${generateOptions.directory}`)
  logger.listItem(`Include tests: ${generateOptions.includeTests ? 'Yes' : 'No'}`)
  logger.listItem(`Include docs: ${generateOptions.includeDocs ? 'Yes' : 'No'}`)
  if (generateOptions.template) {
    logger.listItem(`Template: ${generateOptions.template}`)
  }
  logger.listItem(`Force overwrite: ${generateOptions.force ? 'Yes' : 'No'}`)

  // Confirm generation
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Generate ${type} "${name}"?`,
      default: true,
    },
  ])

  if (!confirm) {
    logger.info('Generation cancelled')
    return
  }

  // Generate code
  logger.newLine()
  logger.startSpinner(`Generating ${type}...`)

  try {
    let generatedFiles: string[] = []

    switch (type) {
      case 'plugin':
        generatedFiles = await generatePlugin(generateOptions)
        break
      case 'middleware':
        generatedFiles = await generateMiddleware(generateOptions)
        break
      case 'route':
        generatedFiles = await generateRoute(generateOptions)
        break
    }

    logger.succeedSpinner(`${type} generated successfully!`)

    // Show generated files
    if (generatedFiles.length > 0) {
      logger.newLine()
      logger.subheader('Generated files:')
      for (const file of generatedFiles) {
        logger.listItem(file)
      }
    }

    // Show next steps
    logger.newLine()
    logger.subheader('Next steps:')

    switch (type) {
      case 'plugin':
        logger.listItem('1. Implement your plugin logic in the generated files')
        logger.listItem('2. Register the plugin in your application')
        logger.listItem('3. Configure plugin settings if needed')
        break
      case 'middleware':
        logger.listItem('1. Implement your middleware logic')
        logger.listItem('2. Add the middleware to your application')
        logger.listItem('3. Configure middleware options if needed')
        break
      case 'route':
        logger.listItem('1. Implement your route handlers')
        logger.listItem('2. Add validation and error handling')
        logger.listItem('3. Test your routes')
        break
    }

    if (generateOptions.includeTests) {
      logger.listItem('4. Run tests to ensure everything works')
    }

    logger.newLine()
    logger.success('🎉 Generation completed!')
  } catch (error) {
    logger.failSpinner('Generation failed')
    throw error
  }
}

export default createGenerateCommand
