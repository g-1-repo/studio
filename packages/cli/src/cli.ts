#!/usr/bin/env node

import chalk from 'chalk'
import { Command } from 'commander'
import { createCommand } from './commands/create.js'
import createGenerateCommand from './commands/generate.js'
import createInfoCommand from './commands/info.js'
import createVersionCommand from './commands/version.js'

const program = new Command()

// CLI metadata
program
  .name('g1')
  .description('G1 API Framework CLI - Scaffold and manage G1 projects')
  .version('0.1.0')

// Add commands
program.addCommand(createCommand)
program.addCommand(createGenerateCommand())
program.addCommand(createInfoCommand())
program.addCommand(createVersionCommand())

// Global error handler
program.exitOverride()

try {
  program.parse()
} catch (error) {
  if (error instanceof Error) {
    console.error(chalk.red('Error:'), error.message)
    process.exit(1)
  }
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}
