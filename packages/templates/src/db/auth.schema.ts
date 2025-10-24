import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { INVITATION_STATUS, ORGANIZATION_ROLES, USER_ROLES } from "../shared";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  // System-wide role with enum constraint
  role: text("role", { enum: Object.values(USER_ROLES) as [string, ...string[]] })
    .default(USER_ROLES.USER)
    .notNull(),
  banned: integer("banned", { mode: "boolean" }),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }),
  username: text("username").unique(),
  displayUsername: text("display_username"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  timezone: text("timezone"),
  city: text("city"),
  country: text("country"),
  region: text("region"),
  regionCode: text("region_code"),
  colo: text("colo"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  impersonatedBy: text("impersonated_by"),
  activeOrganizationId: text("active_organization_id"),
}, (t) => ({
  idxUserId: index("sessions_user_id_idx").on(t.userId),
}));

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  idxProviderAccount: index("accounts_provider_account_idx").on(t.providerId, t.accountId),
  idxUserId: index("accounts_user_id_idx").on(t.userId),
}));

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
}, (t) => ({
  idxIdentifier: index("verifications_identifier_idx").on(t.identifier),
  idxExpiresAt: index("verifications_expires_at_idx").on(t.expiresAt),
}));

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  metadata: text("metadata"),
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Organization-specific role with enum constraint
  role: text("role", { enum: Object.values(ORGANIZATION_ROLES) as [string, ...string[]] })
    .default(ORGANIZATION_ROLES.MEMBER)
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
}, (t) => ({
  idxOrgUser: index("members_org_user_idx").on(t.organizationId, t.userId),
  idxUser: index("members_user_idx").on(t.userId),
}));

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  // Organization role for invitation with enum constraint
  role: text("role", { enum: Object.values(ORGANIZATION_ROLES) as [string, ...string[]] })
    .default(ORGANIZATION_ROLES.MEMBER)
    .notNull(),
  // Invitation status with enum constraint
  status: text("status", { enum: Object.values(INVITATION_STATUS) as [string, ...string[]] })
    .default(INVITATION_STATUS.PENDING)
    .notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// System-wide roles table for flexible permission management
export const systemRoles = sqliteTable("system_roles", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  permissions: text("permissions").notNull(), // JSON array of permissions
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

// Organization-specific roles table for custom role management
export const organizationRoles = sqliteTable("organization_roles", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  permissions: text("permissions").notNull(), // JSON array of permissions
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});
