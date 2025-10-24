import { createId } from '@paralleldrive/cuid2'
import { nanoid } from 'nanoid'

/**
 * Creates a CUID2 that is safe to use in Cloudflare Workers
 */
export function createWorkerSafeCuid2(): string {
  return createId()
}

/**
 * Creates a nanoid that is safe to use in Cloudflare Workers
 */
export function createWorkerSafeNanoid(size?: number): string {
  return nanoid(size)
}

/**
 * Generates a secure random string using crypto.getRandomValues
 * Safe for use in Cloudflare Workers
 */
export function generateSecureRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

/**
 * Generates a UUID v4 using crypto.randomUUID if available,
 * fallback to manual generation for Workers compatibility
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback implementation for environments without crypto.randomUUID
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)

  // Set version (4) and variant bits
  array[6] = (array[6] & 0x0F) | 0x40
  array[8] = (array[8] & 0x3F) | 0x80

  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}
