// Import Workers-safe crypto utilities from @g-1/util
export {
  createWorkerSafeCuid2,
  createWorkerSafeNanoid,
  generateSecureRandomString,
  generateUUID,
} from '@g-1/util/crypto/workers-safe'

// Aliases for backward compatibility
export {
  createWorkerSafeCuid2 as createCuid2,
  createWorkerSafeNanoid as createNanoid,
  generateUUID as createUUID,
  generateSecureRandomString as generateRandomString,
} from '@g-1/util/crypto/workers-safe'
