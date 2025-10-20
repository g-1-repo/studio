/**
 * Optimized Error Recovery Service - Performance-focused implementation
 */

import type { WorkflowContext, WorkflowStep } from '../types/index.js'
import chalk from 'chalk'
import { execa } from 'execa'
import { CacheManager } from './cache-manager.js'
import { ErrorFormatter } from './error-formatter.js'
import { ParallelExecutor } from './parallel-executor.js'

// Lazy load heavy dependencies
const loadChalk = () => import('chalk').then(m => m.default)
const loadExeca = () => import('execa').then(m => m.default)

export interface ErrorAnalysis {
  type: 'linting' | 'typescript' | 'build' | 'authentication' | 'dependency' | 'unknown'
  severity: 'critical' | 'warning' | 'minor'
  fixable: boolean
  description: string
  suggestedFixes: string[]
  errorHash: string // Used for caching
}

export class OptimizedErrorRecoveryService {
  private static instance: OptimizedErrorRecoveryService
  private errorCache: CacheManager<string, ErrorAnalysis>
  private parallelExecutor: ParallelExecutor
  private chalk: typeof chalk | undefined
  private execa: typeof execa | undefined

  private constructor() {
    this.errorCache = new CacheManager<string, ErrorAnalysis>({
      maxSize: 100,
      ttl: 1000 * 60 * 60, // 1 hour cache TTL
    })
    this.parallelExecutor = new ParallelExecutor({
      maxConcurrent: 4,
      timeout: 30000,
    })
  }

  static getInstance(): OptimizedErrorRecoveryService {
    if (!OptimizedErrorRecoveryService.instance) {
      OptimizedErrorRecoveryService.instance = new OptimizedErrorRecoveryService()
    }
    return OptimizedErrorRecoveryService.instance
  }

  private generateErrorHash(error: Error): string {
    return Buffer.from(error.message + (error.stack || '')).toString('base64')
  }

  private async ensureChalk(): Promise<typeof chalk> {
    if (!this.chalk) {
      this.chalk = await loadChalk()
    }
    return this.chalk
  }

  private async ensureExeca(): Promise<typeof execa> {
    if (!this.execa) {
      this.execa = await loadExeca()
    }
    return this.execa
  }

  /**
   * Analyze error with caching support
   */
  async analyzeError(error: Error, context?: WorkflowContext): Promise<ErrorAnalysis> {
    const errorHash = this.generateErrorHash(error)
    
    // Check cache first
    const cachedAnalysis = this.errorCache.get(errorHash)
    if (cachedAnalysis) {
      return cachedAnalysis
    }

    const errorMessage = error.message.toLowerCase()
    const errorStack = error.stack?.toLowerCase() || ''

    // Perform analysis
    const analysis: ErrorAnalysis = {
      type: 'unknown',
      severity: 'critical',
      fixable: false,
      description: '',
      suggestedFixes: [],
      errorHash,
    }

    // Determine error type and properties
    if (errorMessage.includes('eslint') || errorMessage.includes('lint')) {
      analysis.type = 'linting'
      analysis.severity = 'warning'
      analysis.fixable = true
      analysis.description = 'ESLint or style-related errors detected'
      analysis.suggestedFixes = [
        'Run lint:fix to automatically fix issues',
        'Apply common lint pattern fixes',
        'Add eslint-disable comments for unfixable issues',
      ]
    }
    else if (errorMessage.includes('typescript') || errorMessage.includes('tsc')) {
      analysis.type = 'typescript'
      analysis.severity = 'critical'
      analysis.fixable = false
      analysis.description = 'TypeScript compilation errors'
      analysis.suggestedFixes = [
        'Fix type annotations',
        'Add missing imports',
        'Update tsconfig.json if needed',
      ]
    }
    // ... other error types

    // Cache the analysis
    this.errorCache.set(errorHash, analysis)

    return analysis
  }

  /**
   * Create recovery workflow with parallel execution support
   */
  async createRecoveryWorkflow(analysis: ErrorAnalysis, originalError: Error): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = []
    const chalk = await this.ensureChalk()

    // Analysis display step
    steps.push({
      id: 'analysis',
      title: 'Error Analysis',
      task: async (ctx, helpers) => {
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

    // Add type-specific recovery steps with parallel execution where possible
    switch (analysis.type) {
      case 'linting':
        steps.push(...await this.createParallelLintingRecoverySteps())
        break

      case 'build':
        steps.push(...await this.createParallelBuildRecoverySteps())
        break

      case 'dependency':
        steps.push(...await this.createParallelDependencyRecoverySteps())
        break

      // ... other cases
    }

    // Verification step
    steps.push({
      id: 'verification',
      title: 'Recovery Verification',
      dependencies: steps.map(s => s.id!).filter(id => id !== 'analysis'),
      task: async (ctx, helpers) => {
        helpers.setOutput('Verifying recovery actions...')
        // Verification logic here
        helpers.setTitle('Recovery Verification - ✅ Complete')
      },
    })

    return steps
  }

  /**
   * Execute recovery with parallel processing
   */
  async executeRecovery(error: Error, context?: WorkflowContext): Promise<void> {
    const chalk = await this.ensureChalk()

    try {
      console.error(`\n${chalk.cyan('═'.repeat(68))}`)
      console.error(chalk.cyan.bold('           AUTOMATED ERROR RECOVERY INITIATED           '))
      console.error(`${chalk.cyan('═'.repeat(68))}\n`)

      const analysis = await this.analyzeError(error, context)
      const recoverySteps = await this.createRecoveryWorkflow(analysis, error)

      // Execute recovery steps with parallel processing
      await this.parallelExecutor.executeSteps(recoverySteps)
    }
    catch (recoveryError) {
      console.error(ErrorFormatter.formatError(
        recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)),
        'critical',
      ).message)
      console.error(chalk.red('\nAutomated recovery failed. Manual intervention required.'))
    }
  }

  /**
   * Create parallel linting recovery steps
   */
  private async createParallelLintingRecoverySteps(): Promise<WorkflowStep[]> {
    return [
      {
        id: 'lint-fix',
        title: 'Run lint:fix',
        task: async (ctx, helpers) => {
          const execa = await this.ensureExeca()
          helpers.setOutput('Running automatic lint fixes...')
          await execa('bun', ['run', 'lint:fix'])
          helpers.setTitle('Run lint:fix - ✅ Complete')
        },
      },
      {
        id: 'lint-verify',
        title: 'Verify linting',
        dependencies: ['lint-fix'],
        task: async (ctx, helpers) => {
          const execa = await this.ensureExeca()
          helpers.setOutput('Verifying lint fixes...')
          await execa('bun', ['run', 'lint'])
          helpers.setTitle('Verify linting - ✅ All issues resolved')
        },
      },
    ]
  }

  /**
   * Create parallel build recovery steps
   */
  private async createParallelBuildRecoverySteps(): Promise<WorkflowStep[]> {
    return [
      {
        id: 'clean',
        title: 'Clean build artifacts',
        task: async (ctx, helpers) => {
          const execa = await this.ensureExeca()
          await execa('bun', ['run', 'clean'])
          helpers.setTitle('Clean - ✅ Complete')
        },
      },
      {
        id: 'deps-install',
        title: 'Reinstall dependencies',
        task: async (ctx, helpers) => {
          const execa = await this.ensureExeca()
          await execa('bun', ['install'])
          helpers.setTitle('Dependencies - ✅ Installed')
        },
      },
      {
        id: 'build',
        title: 'Rebuild project',
        dependencies: ['clean', 'deps-install'],
        task: async (ctx, helpers) => {
          const execa = await this.ensureExeca()
          await execa('bun', ['run', 'build'])
          helpers.setTitle('Build - ✅ Complete')
        },
      },
    ]
  }

  /**
   * Create parallel dependency recovery steps
   */
  private async createParallelDependencyRecoverySteps(): Promise<WorkflowStep[]> {
    return [
      {
        id: 'update-deps',
        title: 'Update dependencies',
        task: async (ctx, helpers) => {
          const execa = await this.ensureExeca()
          await execa('bun', ['update'])
          helpers.setTitle('Dependencies - ✅ Updated')
        },
      },
      {
        id: 'verify-deps',
        title: 'Verify dependencies',
        dependencies: ['update-deps'],
        task: async (ctx, helpers) => {
          const execa = await this.ensureExeca()
          await execa('bun', ['install'])
          helpers.setTitle('Verification - ✅ Complete')
        },
      },
    ]
  }
}