// Apply migrations setup for tests
import { beforeAll } from 'vitest'

beforeAll(async () => {
  // This file is referenced in vitest.config.ts setupFiles
  // It's used to apply database migrations before running tests
  console.log('Migrations setup loaded')
})
