import { describe, expect, it } from 'vitest'
import packageJson from '../package.json'

describe('boilerplate Package', () => {
  it('should pass basic test', () => {
    // Simple test to verify the package is set up correctly
    expect(true).toBe(true)
  })

  it('should have proper package structure', () => {
    // Test that basic imports work
    expect(packageJson.name).toBe('@g-1/boilerplate')
    expect(packageJson.version).toBeDefined()
  })
})
