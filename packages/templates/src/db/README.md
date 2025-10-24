# Database Structure

This directory contains all database table definitions using Drizzle ORM with SQLite.

## Structure Overview

```
db/
├── index.ts           # Database connection factory
├── schema.ts          # Central schema export (all tables)
├── auth.schema.ts     # Better Auth tables (keep as-is)
├── tables/            # Custom application tables
│   ├── index.ts       # Export all custom tables
│   └── [domain].table.ts
└── README.md          # This file
```

## File Naming Conventions

### **Better Auth Tables**

- **File**: `auth.schema.ts`
- **Purpose**: Contains all Better Auth related tables
- **Convention**: Keep as single file for framework compatibility
- **Tables**: `users`, `sessions`, `accounts`, `verifications`, `organizations`, `members`, `invitations`, etc.

### **Custom Application Tables**

- **File Pattern**: `[domain].table.ts`
- **Purpose**: Domain-specific business logic tables
- **Convention**: One domain per file for better organization
- **Examples**:
  - `analytics.table.ts` - Analytics and tracking
  - `billing.table.ts` - Billing and subscriptions
  - `notifications.table.ts` - Notifications system

## Why This Structure?

### **Keep Better Auth Tables Together**

✅ **Framework compatibility** - Better Auth may auto-update these tables
✅ **Cohesive unit** - Auth tables work together as a system
✅ **Easier updates** - Single file to manage when Better Auth updates
✅ **Clear separation** - Distinguishes framework code from business logic

### **Separate Custom Tables by Domain**

✅ **Better organization** - Each business domain gets its own file
✅ **Team development** - Multiple developers can work on different domains
✅ **Easier maintenance** - Smaller, focused files are easier to understand
✅ **Clear ownership** - Each domain can have dedicated maintainers

## Table Design Patterns

### **Common Patterns Used:**

```ts
// 1. Primary key pattern
id: text('id').primaryKey()

// 2. Timestamp pattern
createdAt: integer('created_at', { mode: 'timestamp' })
  .$defaultFn(() => new Date())
  .notNull()

updatedAt: integer('updated_at', { mode: 'timestamp' })
  .$defaultFn(() => new Date())
  .notNull()

// 3. Foreign key pattern
organizationId: text('organization_id')
  .notNull()
  .references(() => organizations.id, { onDelete: 'cascade' })

// 4. Enum constraint pattern
status: text('status', {
  enum: ['draft', 'published', 'archived']
}).default('draft').notNull()

// 5. JSON metadata pattern
metadata: text('metadata') // Store as JSON string
```

### **Multi-tenant Pattern:**

All custom tables should include `organizationId` for proper multi-tenant isolation:

```typescript
organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' })
```

## Usage Examples

### **Creating a New Domain Table:**

1. **Create the table file:**

```bash
touch src/db/tables/analytics.table.ts
```

2. **Define your tables:**

```typescript
// analytics.table.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { organizations, users } from '../auth.schema'

export const pageViews = sqliteTable('page_views', {
  id: text('id').primaryKey(),
  path: text('path').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),

  // Relations
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .notNull(),
})
```

3. **Export in tables/index.ts:**

```typescript
export * from './analytics.table'
```

4. **Generate and run migrations:**

```bash
bun db:generate
bun db:migrate:local
```

### **Using Tables in Your Code:**

```typescript
import { db } from '@/db'
import { pageViews, users } from '@/db/schema'

// All tables are available from the central schema export
const userPageViews = await db
  .select()
  .from(pageViews)
  .where(eq(pageViews.userId, userId))
```

## Migration Workflow

1. **Make schema changes** in your `.table.ts` files
2. **Generate migration**: `bun db:generate`
3. **Review generated SQL** in `drizzle/` directory
4. **Apply locally**: `bun db:migrate:local`
5. **Test your changes**
6. **Apply to production**: `bun db:migrate:remote`

## Best Practices

### **DO:**

- ✅ Use descriptive table and column names
- ✅ Always include `createdAt` and `updatedAt` timestamps
- ✅ Use proper foreign key constraints with cascade behavior
- ✅ Use enums for fixed value sets
- ✅ Include `organizationId` for multi-tenant isolation
- ✅ Add indexes for frequently queried columns

### **DON'T:**

- ❌ Modify Better Auth tables directly (use `auth.schema.ts`)
- ❌ Create giant table files (split by domain)
- ❌ Skip foreign key constraints
- ❌ Use generic names like `data` or `info`
- ❌ Forget to export new tables in `tables/index.ts`

This structure provides the best of both worlds: framework compatibility for Better Auth and excellent organization for your custom business logic.
