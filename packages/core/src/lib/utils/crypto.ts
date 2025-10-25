// Local crypto utilities for Cloudflare Workers
// Replaces @g-1/util/crypto/workers-safe

/**
 * Generate a CUID2 using crypto.randomUUID() as fallback
 * This is a simplified implementation for Cloudflare Workers
 */
export function createWorkerSafeCuid2(): string {
  // Use crypto.randomUUID() which is available in Cloudflare Workers
  return crypto.randomUUID().replace(/-/g, '')
}

// Aliases for backward compatibility
export const createCuid2 = createWorkerSafeCuid2

/**
 * Generate a nanoid-like string using crypto.getRandomValues()
 */
export function createWorkerSafeNanoid(size = 21): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)

  let result = ''
  for (let i = 0; i < size; i++) {
    result += alphabet[bytes[i] % alphabet.length]
  }
  return result
}

// Aliases for backward compatibility
export const createNanoid = createWorkerSafeNanoid

/**
 * Generate a secure random string
 */
export function generateSecureRandomString(length = 32): string {
  return createWorkerSafeNanoid(length)
}

// Aliases for backward compatibility
export const generateRandomString = generateSecureRandomString

/**
 * Generate a UUID using crypto.randomUUID()
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

// Aliases for backward compatibility
export const createUUID = generateUUID
