// Cloudflare Workers-compatible cuid2 stub
export function createId(): string {
  return `test-${Math.random().toString(36).substring(2, 15)}`
}

export function isCuid(id: string): boolean {
  return typeof id === 'string' && id.length > 0
}

export default {
  createId,
  isCuid,
}
