import { createWorkerSafeCuid2 as createId } from '@g-1/util'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

export const earlyAccessRequestsTable = sqliteTable(
  'early_access_request_table',
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => createId()),
    // Email is normalized to lowercase at the application level before storage
    email: text('email', { mode: 'text' }).notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  table => [uniqueIndex('email_idx').on(table.email)]
)

export const selectEarlyAccessRequestsSchema = createSelectSchema(earlyAccessRequestsTable)

export const insertEarlyAccessRequestSchema = createInsertSchema(earlyAccessRequestsTable, {
  email: z.string().email(),
})
  .required({
    email: true,
  })
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })

// Type exports
export type EarlyAccessRequest = typeof earlyAccessRequestsTable.$inferSelect
export type NewEarlyAccessRequest = typeof earlyAccessRequestsTable.$inferInsert
