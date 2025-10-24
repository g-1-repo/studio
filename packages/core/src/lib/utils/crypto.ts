// Import Workers-safe crypto utilities from @g-1/util
// Aliases for backward compatibility
export {
  createWorkerSafeCuid2,
  createWorkerSafeCuid2 as createCuid2,
  createWorkerSafeNanoid,
  createWorkerSafeNanoid as createNanoid,
  generateSecureRandomString,
  generateSecureRandomString as generateRandomString,
  generateUUID,
  generateUUID as createUUID,
} from '@g-1/util/crypto/workers-safe'
