// Better Auth tables (keep as-is for framework compatibility)
export * from './auth.schema'

// Custom application tables (organized by domain)
export * from './tables'

// Re-export specific tables for drizzle query access
export { earlyAccessRequestsTable } from './tables/early-access-request.table'
