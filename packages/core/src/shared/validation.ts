import { isValidEmail, isValidPhone, isValidUrl, isValidUUID } from '@g-1/util/validation'
// Shared validation schemas for Livemercial API
import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

export const idSchema = z.string().min(1)

// Enhanced validation schemas using @g-1/util
export const emailSchema = z.string().refine(isValidEmail, {
  message: 'Invalid email format',
})

export const uuidSchema = z.string().refine(isValidUUID, {
  message: 'Invalid UUID format',
})

export const urlSchema = z.string().refine(isValidUrl, {
  message: 'Invalid URL format',
})

export const phoneSchema = z.string().refine(isValidPhone, {
  message: 'Invalid phone number format',
})

export const timestampSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type PaginationInput = z.infer<typeof paginationSchema>
export type IdInput = z.infer<typeof idSchema>
export type EmailInput = z.infer<typeof emailSchema>
export type UuidInput = z.infer<typeof uuidSchema>
export type UrlInput = z.infer<typeof urlSchema>
export type PhoneInput = z.infer<typeof phoneSchema>
