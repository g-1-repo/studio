// Import Workers-safe utilities from @g-1/util
import {
  createWorkerSafeCuid2,
  generateWorkerSafePrefixedId,
  isValidWorkerSafeCuid2,
  isValidWorkerSafePrefixedCuid2,
} from '@g-1/util/crypto/workers-safe'

/**
 * Generate a database-safe ID (Workers-compatible)
 */
export function generateId(): string {
  return createWorkerSafeCuid2()
}

/**
 * Generate an ID with prefix
 */
export function generateIdWithPrefix(prefix: string): string {
  return generateWorkerSafePrefixedId(`${prefix}_`)
}

/**
 * Basic CUID2 validation
 */
export function isValidCuid2(id: string): boolean {
  return isValidWorkerSafeCuid2(id)
}

/**
 * Validate prefixed CUID2
 */
export function isValidPrefixedCuid2(id: string, expectedPrefix?: string): boolean {
  if (!expectedPrefix) {
    // If no expected prefix, just check if it has any prefix
    return id.includes('_') && isValidCuid2(id.split('_')[1])
  }
  return isValidWorkerSafePrefixedCuid2(id, `${expectedPrefix}_`)
}

/**
 * Drizzle helper for creating a CUID2 primary key column with default value
 */
export function cuid2Id() {
  return {
    $defaultFn: generateId,
  }
}
