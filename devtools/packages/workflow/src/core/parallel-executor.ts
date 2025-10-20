/**
 * Parallel Executor - Manages concurrent task execution with resource limits
 */

import type { WorkflowStep } from '../types/index.js'

export interface ParallelExecutorOptions {
  maxConcurrent?: number
  timeout?: number
}

export class ParallelExecutor {
  private maxConcurrent: number
  private timeout: number
  private running: Set<Promise<any>>

  constructor(options: ParallelExecutorOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 4
    this.timeout = options.timeout || 30000 // 30 seconds default
    this.running = new Set()
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    const timeoutPromise = new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Task execution timeout')), timeout)
    })

    return Promise.race([promise, timeoutPromise])
  }

  async executeAll<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = []
    const taskQueue = [...tasks]

    while (taskQueue.length > 0 || this.running.size > 0) {
      // Fill up concurrent slots
      while (this.running.size < this.maxConcurrent && taskQueue.length > 0) {
        const task = taskQueue.shift()!
        const execution = this.executeWithTimeout(task(), this.timeout)
          .then(result => {
            results.push(result)
            this.running.delete(execution)
          })
          .catch(error => {
            this.running.delete(execution)
            throw error
          })

        this.running.add(execution)
      }

      // Wait for at least one task to complete
      if (this.running.size > 0) {
        await Promise.race(this.running)
      }
    }

    return results
  }

  async executeSteps(steps: WorkflowStep[]): Promise<void> {
    const independentSteps = steps.filter(step => !step.dependencies)
    const dependentSteps = steps.filter(step => step.dependencies)

    // Execute independent steps in parallel
    await this.executeAll(
      independentSteps.map(step => async () => {
        if (step.task) {
          await step.task({}, {
            setOutput: () => {},
            setTitle: () => {},
            setProgress: () => {},
          })
        }
      }),
    )

    // Execute dependent steps sequentially
    for (const step of dependentSteps) {
      if (step.task) {
        await step.task({}, {
          setOutput: () => {},
          setTitle: () => {},
          setProgress: () => {},
        })
      }
    }
  }
}