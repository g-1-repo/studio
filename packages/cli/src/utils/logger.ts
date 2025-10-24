import chalk from 'chalk'
import ora, { Ora } from 'ora'

/**
 * Logger utility for consistent CLI output
 */
export class Logger {
  private spinner: Ora | null = null

  /**
   * Log an info message
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message)
  }

  /**
   * Log a success message
   */
  success(message: string): void {
    console.log(chalk.green('✓'), message)
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message)
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    console.log(chalk.red('✗'), message)
  }

  /**
   * Log a debug message (only in verbose mode)
   */
  debug(message: string, verbose = false): void {
    if (verbose) {
      console.log(chalk.gray('🐛'), chalk.gray(message))
    }
  }

  /**
   * Start a spinner with a message
   */
  startSpinner(message: string): void {
    this.spinner = ora(message).start()
  }

  /**
   * Update spinner text
   */
  updateSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.text = message
    }
  }

  /**
   * Stop spinner with success
   */
  succeedSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.succeed(message)
      this.spinner = null
    }
  }

  /**
   * Stop spinner with failure
   */
  failSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.fail(message)
      this.spinner = null
    }
  }

  /**
   * Stop spinner
   */
  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop()
      this.spinner = null
    }
  }

  /**
   * Log a blank line
   */
  newLine(): void {
    console.log()
  }

  /**
   * Log a header with styling
   */
  header(message: string): void {
    console.log()
    console.log(chalk.bold.cyan(message))
    console.log(chalk.cyan('='.repeat(message.length)))
  }

  /**
   * Log a subheader with styling
   */
  subheader(message: string): void {
    console.log()
    console.log(chalk.bold(message))
    console.log(chalk.gray('-'.repeat(message.length)))
  }

  /**
   * Log a list item
   */
  listItem(message: string, indent = 0): void {
    const indentation = '  '.repeat(indent)
    console.log(`${indentation}• ${message}`)
  }

  /**
   * Log code block
   */
  code(code: string): void {
    console.log()
    console.log(chalk.gray('```'))
    console.log(chalk.cyan(code))
    console.log(chalk.gray('```'))
    console.log()
  }

  /**
   * Log a table-like structure
   */
  table(data: Array<{ key: string; value: string }>): void {
    const maxKeyLength = Math.max(...data.map(item => item.key.length))
    
    data.forEach(item => {
      const paddedKey = item.key.padEnd(maxKeyLength)
      console.log(`${chalk.gray(paddedKey)} : ${item.value}`)
    })
  }
}

// Export singleton instance
export const logger = new Logger()