/**
 * Shared Automated Error Recovery Service - Intelligent workflow error fixing
 */

import chalk from 'chalk'
import { execa } from 'execa'
import { ErrorFormatter } from '../debug/index.js'

import type { WorkflowContext, WorkflowStep } from './task-engine.js'
import { createTaskEngine } from './task-engine.js'

export interface ErrorAnalysis {
  type: 'linting' | 'typescript' | 'build' | 'authentication' | 'dependency' | 'unknown'
  severity: 'critical' | 'warning' | 'minor'
  fixable: boolean
  description: string
  suggestedFixes: string[]
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService

  private constructor() {}

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService()
    }
    return ErrorRecoveryService.instance
  }

  async analyzeError(error: Error, _context?: any): Promise<ErrorAnalysis> {
    const errorMessage = error.message.toLowerCase()
    const errorStack = error.stack?.toLowerCase() || ''

    if (errorMessage.includes('eslint') || errorMessage.includes('lint')
      || errorStack.includes('eslint') || errorMessage.includes('style')) {
      return {
        type: 'linting',
        severity: 'warning',
        fixable: true,
        description: 'ESLint or style-related errors detected',
        suggestedFixes: [
          'Run lint:fix to automatically fix issues',
          'Apply common lint pattern fixes',
          'Add eslint-disable comments for unfixable issues',
        ],
      }
    }

    if (errorMessage.includes('typescript') || errorMessage.includes('tsc')
      || errorMessage.includes('type') || errorStack.includes('typescript')) {
      return {
        type: 'typescript',
        severity: 'critical',
        fixable: false,
        description: 'TypeScript compilation errors',
        suggestedFixes: [
          'Fix type annotations',
          'Add missing imports',
          'Update tsconfig.json if needed',
        ],
      }
    }

    if (errorMessage.includes('build') || errorMessage.includes('compile')
      || errorMessage.includes('bundl')) {
      return {
        type: 'build',
        severity: 'critical',
        fixable: true,
        description: 'Build or compilation errors',
        suggestedFixes: [
          'Clean and rebuild project',
          'Update dependencies',
          'Fix import paths',
        ],
      }
    }

    if (errorMessage.includes('401') || errorMessage.includes('authentication')
      || errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
      return {
        type: 'authentication',
        severity: 'critical',
        fixable: false,
        description: 'Authentication or authorization errors',
        suggestedFixes: [
          'Check npm token',
          'Re-authenticate with npm login',
          'Verify repository permissions',
        ],
      }
    }

    if (errorMessage.includes('module') || errorMessage.includes('package')
      || errorMessage.includes('dependency') || errorMessage.includes('import')) {
      return {
        type: 'dependency',
        severity: 'warning',
        fixable: true,
        description: 'Missing or incompatible dependencies',
        suggestedFixes: [
          'Install missing dependencies',
          'Update package versions',
          'Clear node_modules and reinstall',
        ],
      }
    }

    return {
      type: 'unknown',
      severity: 'critical',
      fixable: false,
      description: 'Unknown error type',
      suggestedFixes: [
        'Check error logs manually',
        'Search for similar issues online',
        'Contact support if needed',
      ],
    }
  }

  async createRecoveryWorkflow(analysis: ErrorAnalysis, _originalError: Error): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = []

    steps.push({
      title: 'Error Analysis',
      task: async (_ctx, helpers) => {
        helpers.setOutput('Analyzing error for automated recovery...')

        const errorBox = ErrorFormatter.createErrorBox(
          'AUTOMATED ERROR RECOVERY',
          `Error Type: ${analysis.type} | Severity: ${analysis.severity} | Fixable: ${analysis.fixable ? 'Yes' : 'No'}`,
          analysis.suggestedFixes,
        )

        console.error(errorBox)
        helpers.setTitle(`Error Analysis - ✅ ${analysis.type} error detected`)
      },
    })

    switch (analysis.type) {
      case 'linting':
        steps.push(...await this.createLintingRecoverySteps())
        break
      case 'build':
        steps.push(...await this.createBuildRecoverySteps())
        break
      case 'dependency':
        steps.push(...await this.createDependencyRecoverySteps())
        break
      case 'typescript':
        steps.push({
          title: 'TypeScript Error Advisory',
          task: async (_ctx, helpers) => {
            helpers.setOutput('TypeScript errors require manual intervention')
            console.error(chalk.yellow('⚠️  TypeScript errors cannot be automatically fixed'))
            console.error(chalk.gray('Please review and fix type errors manually'))
            helpers.setTitle('TypeScript Error Advisory - ✅ Manual intervention required')
          },
        })
        break
      case 'authentication':
        steps.push({
          title: 'Authentication Error Advisory',
          task: async (_ctx, helpers) => {
            helpers.setOutput('Authentication errors require manual setup')
            console.error(chalk.yellow('⚠️  Authentication errors require manual intervention'))
            console.error(chalk.gray('Please check your npm token or run: npm login'))
            helpers.setTitle('Authentication Error Advisory - ✅ Manual intervention required')
          },
        })
        break
      default:
        steps.push({
          title: 'Unknown Error Advisory',
          task: async (_ctx, helpers) => {
            helpers.setOutput('Unknown error requires manual investigation')
            console.error(chalk.yellow('⚠️  Unknown error type - manual investigation needed'))
            helpers.setTitle('Unknown Error Advisory - ✅ Manual intervention required')
          },
        })
    }

    steps.push({
      title: 'Recovery Verification',
      task: async (_ctx, helpers) => {
        helpers.setOutput('Checking if error has been resolved...')

        if (analysis.fixable) {
          try {
            await execa('bun', ['run', 'lint'], { stdio: 'pipe' })
            helpers.setOutput('Lint check passed')
          }
          catch {
            helpers.setOutput('Lint issues may still exist')
          }

          try {
            await execa('bun', ['run', 'typecheck'], { stdio: 'pipe' })
            helpers.setOutput('Type-check passed')
          }
          catch {
            helpers.setOutput('Type-check issues may still exist')
          }
        }
      },
    })

    return steps
  }

  async executeRecovery(error: Error, context?: WorkflowContext): Promise<void> {
    try {
      console.error(`\n${chalk.cyan('═'.repeat(68))}`)
      console.error(chalk.cyan.bold('           AUTOMATED ERROR RECOVERY INITIATED           '))
      console.error(`${chalk.cyan('═'.repeat(68))}\n`)

      const analysis = await this.analyzeError(error, context)
      const recoverySteps = await this.createRecoveryWorkflow(analysis, error)

      const engine = createTaskEngine({ concurrent: false, exitOnError: true, showTimer: true })
      await engine.execute(recoverySteps, context)
    }
    catch (recoveryError) {
      console.error(ErrorFormatter.formatError(
        recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        'critical',
      ).message)
      console.error(chalk.red('\nAutomated recovery failed. Manual intervention required.'))
    }
  }

  private async createLintingRecoverySteps(): Promise<WorkflowStep[]> {
    return [
      {
        title: 'Run lint:fix',
        task: async (_ctx, helpers) => {
          helpers.setOutput('Running automatic lint fixes...')
          await execa('bun', ['run', 'lint:fix'])
          helpers.setTitle('Run lint:fix - ✅ Complete')
        },
      },
      {
        title: 'Verify linting',
        task: async (_ctx, helpers) => {
          helpers.setOutput('Verifying lint fixes...')
          await execa('bun', ['run', 'lint'])
          helpers.setTitle('Verify linting - ✅ All issues resolved')
        },
      },
    ]
  }

  private async createBuildRecoverySteps(): Promise<WorkflowStep[]> {
    return [
      {
        title: 'Clean build artifacts',
        task: async (_ctx, helpers) => {
          await execa('bun', ['run', 'clean'])
          helpers.setTitle('Clean - ✅ Complete')
        },
      },
      {
        title: 'Build project',
        task: async (_ctx, helpers) => {
          await execa('bun', ['run', 'build'])
          helpers.setTitle('Build - ✅ Complete')
        },
      },
    ]
  }

  private async createDependencyRecoverySteps(): Promise<WorkflowStep[]> {
    return [
      {
        title: 'Install dependencies',
        task: async (_ctx, helpers) => {
          await execa('bun', ['install'])
          helpers.setTitle('Install dependencies - ✅ Complete')
        },
      },
      {
        title: 'Update dependencies',
        task: async (_ctx, helpers) => {
          await execa('bun', ['update'])
          helpers.setTitle('Update dependencies - ✅ Complete')
        },
      },
    ]
  }
}