import { EventEmitter } from 'node:events'
import { setupCloudflareWorkerTests } from '@g-1/test'
import { afterEach } from 'vitest'
import { clearRepositoryCaches } from '@/lib/base-repository'

// Increase EventEmitter max listeners for test environment
EventEmitter.defaultMaxListeners = 20

// Set up test environment with enhanced utilities
setupCloudflareWorkerTests()

afterEach(() => {
  clearRepositoryCaches()
})

// EOF
