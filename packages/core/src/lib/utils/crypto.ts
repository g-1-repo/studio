// Import Workers-safe crypto utilities from @g-1/util
export {
  createWorkerSafeCuid2,
  generateWorkerSafeHexId,
  generateWorkerSafeId,
  generateWorkerSafeIdWith,
  generateWorkerSafeNumericId,
  generateWorkerSafeUrlSafeId,
  WORKERS_SAFE_ALPHABETS,
} from '@g-1/util/crypto/workers-safe'

// Aliases for backward compatibility
export {
  WORKERS_SAFE_ALPHABETS as ALPHABETS,
  generateWorkerSafeHexId as generateHexId,
  generateWorkerSafeId as generateId,
  generateWorkerSafeIdWith as generateIdWith,
  generateWorkerSafeNumericId as generateNumericId,
  generateWorkerSafeUrlSafeId as generateUrlSafeId,
} from '@g-1/util/crypto/workers-safe'
