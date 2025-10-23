/**
 * Auth-related constants shared across all API versions
 */

// System-wide user roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const

// Organization-specific member roles
export const ORGANIZATION_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const

// Invitation status values
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const

// Comprehensive permissions system
export const PERMISSIONS = {
  // System-level permissions
  SYSTEM_ADMIN: 'system:admin',

  // User management permissions
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_BAN: 'user:ban',

  // Organization permissions
  ORG_CREATE: 'organization:create',
  ORG_READ: 'organization:read',
  ORG_UPDATE: 'organization:update',
  ORG_DELETE: 'organization:delete',
  ORG_MANAGE: 'org:manage',
  ORG_VIEW: 'org:view',
  ORG_BILLING: 'org:billing',

  // Member management permissions
  MEMBER_INVITE: 'member:invite',
  MEMBER_REMOVE: 'member:remove',
  MEMBER_VIEW: 'member:view',
  MEMBER_MANAGE_ROLES: 'member:manage_roles',

  // Content permissions
  CONTENT_CREATE: 'content:create',
  CONTENT_READ: 'content:read',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_EDIT_OWN: 'content:edit_own',
  CONTENT_EDIT_ALL: 'content:edit_all',
  CONTENT_MODERATE: 'content:moderate',

  // Settings & Configuration
  SETTINGS_MANAGE: 'settings:manage',
  SETTINGS_VIEW: 'settings:view',

  // Analytics & Reporting
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  ANALYTICS_FULL: 'analytics:full_access',

  // Moderation & Reports
  REPORTS_VIEW: 'reports:view',
  REPORTS_MANAGE: 'reports:manage',

  // API & Integration permissions
  API_READ: 'api:read',
  API_WRITE: 'api:write',
  API_ADMIN: 'api:admin',
} as const

// Type definitions for better TypeScript support
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]
export type OrganizationRole = typeof ORGANIZATION_ROLES[keyof typeof ORGANIZATION_ROLES]
export type InvitationStatus = typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS]
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Validation helper functions
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(USER_ROLES).includes(role as UserRole)
}

export function isValidOrganizationRole(role: string): role is OrganizationRole {
  return Object.values(ORGANIZATION_ROLES).includes(role as OrganizationRole)
}

export function isValidInvitationStatus(status: string): status is InvitationStatus {
  return Object.values(INVITATION_STATUS).includes(status as InvitationStatus)
}

export function isValidPermission(permission: string): permission is Permission {
  return Object.values(PERMISSIONS).includes(permission as Permission)
}

// Permission utility functions
export function parsePermissions(permissionsJson: string | null): Permission[] {
  if (!permissionsJson)
    return []

  try {
    const parsed = JSON.parse(permissionsJson)
    return Array.isArray(parsed) ? parsed.filter(isValidPermission) : []
  }
  catch {
    return []
  }
}

export function serializePermissions(permissions: Permission[]): string {
  return JSON.stringify(permissions)
}

export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes(PERMISSIONS.SYSTEM_ADMIN)
}

export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission))
}

export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission))
}

// Role-based permission defaults (for when creating roles)
export const DEFAULT_USER_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.SYSTEM_ADMIN, // This grants all other permissions
  ],
  [USER_ROLES.MODERATOR]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.ORG_READ,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.CONTENT_MODERATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_MANAGE,
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE, // own profile
    PERMISSIONS.ORG_CREATE,
    PERMISSIONS.ORG_READ, // own orgs
    PERMISSIONS.ORG_VIEW,
  ],
}

export const DEFAULT_ORGANIZATION_ROLE_PERMISSIONS: Record<OrganizationRole, Permission[]> = {
  [ORGANIZATION_ROLES.OWNER]: [
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.ORG_DELETE,
    PERMISSIONS.ORG_BILLING,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.MEMBER_MANAGE_ROLES,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_EDIT_ALL,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.ANALYTICS_FULL,
    PERMISSIONS.API_ADMIN,
  ],
  [ORGANIZATION_ROLES.ADMIN]: [
    PERMISSIONS.ORG_MANAGE,
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_EDIT_ALL,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.API_WRITE,
  ],
  [ORGANIZATION_ROLES.MEMBER]: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_EDIT_OWN,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.API_READ,
  ],
  [ORGANIZATION_ROLES.VIEWER]: [
    PERMISSIONS.ORG_VIEW,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.API_READ,
  ],
}

// Helper to get default permissions for a role
export function getDefaultPermissionsForUserRole(role: UserRole): Permission[] {
  return DEFAULT_USER_ROLE_PERMISSIONS[role] || []
}

export function getDefaultPermissionsForOrganizationRole(role: OrganizationRole): Permission[] {
  return DEFAULT_ORGANIZATION_ROLE_PERMISSIONS[role] || []
}

// Helper to combine permissions from multiple sources
export function combinePermissions(...permissionArrays: Permission[][]): Permission[] {
  const combined = permissionArrays.flat()
  return [...new Set(combined)] // Remove duplicates
}
