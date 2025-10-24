/**
 * Type checking utilities
 */

/**
 * Check if a value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

/**
 * Check if a value is not null or undefined
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

/**
 * Check if a value is not null
 */
export function isNotNull<T>(value: T | null): value is T {
  return value !== null
}

/**
 * Check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value)
}

/**
 * Check if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

/**
 * Check if a value is an object (but not null or array)
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Check if a value is a function
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}

/**
 * Check if a value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date
}

/**
 * Check if a value is a Promise
 */
export function isPromise(value: unknown): value is Promise<unknown> {
  return value instanceof Promise
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (isNullish(value))
    return true
  if (isString(value))
    return value.length === 0
  if (isArray(value))
    return value.length === 0
  if (isObject(value))
    return Object.keys(value).length === 0
  return false
}

/**
 * Type guard for non-empty arrays
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0
}

/**
 * Utility type for making specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Utility type for making all properties required (alias for Required)
 */
export type RequiredKeys<T> = Required<T>

/**
 * Utility type for deep partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Utility type for deep required
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P]
}

/**
 * Utility type for deep readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}

/**
 * Utility type for making types more readable
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

/**
 * Utility type for converting union to intersection
 */
export type UnionToIntersection<U>
  = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

/**
 * Utility type for non-empty arrays
 */
export type NonEmptyArray<T> = [T, ...T[]]

/**
 * Utility type for extracting the value type from a Promise
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T

/**
 * Utility type for creating a union of all possible dot-notation paths in an object
 */
export type DotNotation<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? DotNotation<T[K], `${Prefix}${string & K}.`>
    : `${Prefix}${string & K}`
}[keyof T]

/**
 * Utility type for creating a type-safe pick by dot notation
 */
export type PickByPath<T, Path extends string>
  = Path extends `${infer Key}.${infer Rest}`
    ? Key extends keyof T
      ? PickByPath<T[Key], Rest>
      : never
    : Path extends keyof T
      ? T[Path]
      : never
