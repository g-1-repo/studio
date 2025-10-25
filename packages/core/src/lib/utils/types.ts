// Local type checking utilities for Cloudflare Workers
// Replaces @g-1/util type utilities

// Type utilities
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

export type NonEmptyArray<T> = [T, ...T[]]

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type RequiredKeys<T> = {
  [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? never : K
}[keyof T]

export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

// Type guards
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function'
}

export function isNotNull<T>(value: T | null): value is T {
  return value !== null
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}
