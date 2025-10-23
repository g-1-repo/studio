import type appType from '@/app'
// Re-export utilities from @g-1/test with compatibility layer
import {
  clearOutbox as _clearOutbox,
  getOutbox as _getOutbox,
  postJSON as _postJSON,
  requestJSON as _requestJSON,
  requestWithCookies as _requestWithCookies,
  resetCookies as _resetCookies,
  uniqueEmail as _uniqueEmail,
} from '@g-1/test'

// Compatibility wrappers that maintain the original API but add Cloudflare env
export async function requestWithCookies(app: typeof appType, path: string, init: RequestInit = {}, jarKey = 'default') {
  return _requestWithCookies(app as any, path, init as any, jarKey)
}

export async function requestJSON(app: typeof appType, path: string, init: RequestInit, expected: number | number[] = 200, jarKey = 'default') {
  return _requestJSON(app as any, path, init as any, { expected, jarKey })
}

export async function postJSON(app: typeof appType, path: string, body: any, expected: number | number[] = 200, jarKey = 'default') {
  return _postJSON(app as any, path, { body, expected, jarKey })
}

export async function getOutbox(app: typeof appType, jarKey = 'default') {
  return _getOutbox(app as any, jarKey)
}

export async function clearOutbox(app: typeof appType, jarKey = 'default') {
  return _clearOutbox(app as any, jarKey)
}

export const uniqueEmail = _uniqueEmail
export const resetCookies = _resetCookies
