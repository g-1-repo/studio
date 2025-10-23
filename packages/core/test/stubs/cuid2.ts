/**
 * Cloudflare Workers-compatible stub for @paralleldrive/cuid2
 *
 * The original cuid2 package uses crypto.getRandomValues() at module initialization,
 * which violates Cloudflare Workers' global scope restrictions.
 * This stub provides a compatible implementation that works in the Workers runtime.
 */

// Simple counter for predictable test IDs
let counter = 0

/**
 * Generate a simple ID that's compatible with Cloudflare Workers
 * For tests, we use a predictable format that still looks like a CUID
 */
export function createId(): string {
  // Use a simple counter-based approach for tests
  // Format: test_[timestamp]_[counter]
  const timestamp = Date.now().toString(36)
  const count = (++counter).toString(36).padStart(4, '0')
  return `test_${timestamp}_${count}`
}

// For compatibility with different import patterns
export default createId
