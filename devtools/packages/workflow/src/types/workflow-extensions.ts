import type { WorkflowStep } from '../types/index.js'

// Add dependency information to WorkflowStep
declare module '../types/index.js' {
  interface WorkflowStep {
    dependencies?: string[] // IDs of steps that must complete before this one
    id?: string // Unique identifier for the step
  }
}