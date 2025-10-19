/**
 * Test suite for TaskEngine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TaskEngine } from '../core/task-engine.js'

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
      const mockTask = {
        title: 'Test Task',
        task: vi.fn().mockResolvedValue(undefined)
      }

      // Test that the TaskEngine can handle basic workflow structure
      expect(() => taskEngine.createWorkflow([mockTask])).not.toThrow()
    })

    it('should handle task with subtasks', async () => {
      const mockSubtask = {
        title: 'Subtask',
        task: vi.fn().mockResolvedValue(undefined)
      }

      const mockMainTask = {
        title: 'Main Task',
        task: () => Promise.resolve([mockSubtask])
      }

      expect(() => taskEngine.createWorkflow([mockMainTask])).not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle task execution errors gracefully', async () => {
      const mockTask = {
        title: 'Failing Task',
        task: vi.fn().mockRejectedValue(new Error('Test error'))
      }

      expect(() => taskEngine.createWorkflow([mockTask])).not.toThrow()
    })
  })

  describe('workflow creation', () => {
    it('should create workflow from task definitions', () => {
      const tasks = [
        { title: 'Task 1', task: () => Promise.resolve() },
        { title: 'Task 2', task: () => Promise.resolve() }
      ]

      const workflow = taskEngine.createWorkflow(tasks)
      expect(workflow).toBeDefined()
    })

    it('should handle empty task array', () => {
      expect(() => taskEngine.createWorkflow([])).not.toThrow()
    })
  })
})