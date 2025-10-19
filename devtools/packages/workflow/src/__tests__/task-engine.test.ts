/**
 * Test suite for TaskEngine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskEngine, createTaskEngine } from '../core/task-engine.js'
import type { WorkflowStep } from '../types/index.js'

describe('TaskEngine', () => {
  let taskEngine: TaskEngine

  beforeEach(() => {
    taskEngine = new TaskEngine()
  })

  describe('constructor', () => {
    it('should create TaskEngine instance', () => {
      expect(taskEngine).toBeDefined()
      expect(taskEngine).toBeInstanceOf(TaskEngine)
    })
  })

  describe('task execution', () => {
    it('should handle basic task execution', async () => {
      const mockTask: WorkflowStep = {
        title: 'Test Task',
        task: vi.fn().mockResolvedValue(undefined)
      }

      // Test that the TaskEngine can execute workflows
      await expect(taskEngine.execute([mockTask])).resolves.toBeDefined()
    })

    it('should handle task with subtasks', async () => {
      const mockSubtask: WorkflowStep = {
        title: 'Subtask',
        task: vi.fn().mockResolvedValue(undefined)
      }

      const mockMainTask: WorkflowStep = {
        title: 'Main Task',
        subtasks: [mockSubtask]
      }

      await expect(taskEngine.execute([mockMainTask])).resolves.toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle task execution errors gracefully', async () => {
      const mockTask: WorkflowStep = {
        title: 'Failing Task',
        task: vi.fn().mockRejectedValue(new Error('Test error'))
      }

      await expect(taskEngine.execute([mockTask])).rejects.toThrow('Test error')
    })
  })

  describe('workflow execution', () => {
    it('should execute workflow from task definitions', async () => {
      const tasks: WorkflowStep[] = [
        { title: 'Task 1', task: () => Promise.resolve() },
        { title: 'Task 2', task: () => Promise.resolve() }
      ]

      const result = await taskEngine.execute(tasks)
      expect(result).toBeDefined()
    })

    it('should handle empty task array', async () => {
      const result = await taskEngine.execute([])
      expect(result).toBeDefined()
    })
  })

  describe('factory function', () => {
    it('should create TaskEngine via factory', () => {
      const engine = createTaskEngine()
      expect(engine).toBeDefined()
      expect(engine).toBeInstanceOf(TaskEngine)
    })

    it('should accept options via factory', () => {
      const engine = createTaskEngine({ concurrent: true, showTimer: false })
      expect(engine).toBeDefined()
      expect(engine).toBeInstanceOf(TaskEngine)
    })
  })
})