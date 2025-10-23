/**
 * Permission utilities for v1 API
 */
import type { Context } from 'hono'
import type {
  OrganizationRole,
  Permission,
  UserRole,
} from '../shared'

import type { AppBindings } from '@/lib/types'
import { and, eq } from 'drizzle-orm'
import { createMiddleware } from 'hono/factory'

import { createDb } from '@/db'

import { members, users } from '@/db/auth.schema'
import {
  combinePermissions,
  getDefaultPermissionsForOrganizationRole,
  getDefaultPermissionsForUserRole,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
} from '../shared'

/**
 * Get all permissions for a user (system + organization)
 */
export async function getUserPermissions(
  userId: string,
  organizationId?: string,
  env?: any,
): Promise<Permission[]> {
  // Use environment from context or fallback to empty env (will be provided by caller)
  if (!env)
    return []
  const { db } = createDb(env)

  // Get user with system role
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    return []
  }

  // Get system role permissions
  let systemPermissions: Permission[] = []
  if (user.role) {
    systemPermissions = getDefaultPermissionsForUserRole(user.role as UserRole)
  }

  // Get organization role permissions (if in organization context)
  let orgPermissions: Permission[] = []
  if (organizationId) {
    const member = await db.query.members.findFirst({
      where: and(
        eq(members.userId, userId),
        eq(members.organizationId, organizationId),
      ),
    })

    if (member?.role) {
      orgPermissions = getDefaultPermissionsForOrganizationRole(member.role as OrganizationRole)
    }
  }

  // Combine and deduplicate permissions
  return combinePermissions(systemPermissions, orgPermissions)
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(
  userId: string,
  requiredPermission: Permission,
  organizationId?: string,
  env?: any,
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, organizationId, env)
  return hasPermission(userPermissions, requiredPermission)
}

/**
 * Check if user has any of the specified permissions
 */
export async function userHasAnyPermission(
  userId: string,
  requiredPermissions: Permission[],
  organizationId?: string,
  env?: any,
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, organizationId, env)
  return hasAnyPermission(userPermissions, requiredPermissions)
}

/**
 * Check if user has all of the specified permissions
 */
export async function userHasAllPermissions(
  userId: string,
  requiredPermissions: Permission[],
  organizationId?: string,
  env?: any,
): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId, organizationId, env)
  return hasAllPermissions(userPermissions, requiredPermissions)
}

/**
 * Middleware factory for protecting routes with permissions
 */
export function requirePermission(permission: Permission) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const organizationId = c.req.param('organizationId')
    const env = c.env
    const hasAccess = await userHasPermission(user.id, permission, organizationId, env)

    if (!hasAccess) {
      return c.json({
        error: 'Insufficient permissions',
        required: permission,
      }, 403)
    }

    await next()
  })
}

/**
 * Middleware factory for requiring any of multiple permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const organizationId = c.req.param('organizationId')
    const env = c.env
    const hasAccess = await userHasAnyPermission(user.id, permissions, organizationId, env)

    if (!hasAccess) {
      return c.json({
        error: 'Insufficient permissions',
        required: permissions,
      }, 403)
    }

    await next()
  })
}

/**
 * Middleware factory for requiring all of multiple permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const organizationId = c.req.param('organizationId')
    const env = c.env
    const hasAccess = await userHasAllPermissions(user.id, permissions, organizationId, env)

    if (!hasAccess) {
      return c.json({
        error: 'Insufficient permissions',
        required: permissions,
      }, 403)
    }

    await next()
  })
}

/**
 * Utility to check permissions within route handlers
 */
export async function checkPermissionInContext(
  c: Context<AppBindings>,
  permission: Permission,
  organizationId?: string,
): Promise<boolean> {
  const user = c.get('user')
  if (!user)
    return false

  const orgId = organizationId || c.req.param('organizationId')
  return await userHasPermission(user.id, permission, orgId, c.env)
}

/**
 * Get user's permissions for API response
 */
export async function getUserPermissionsForResponse(
  userId: string,
  organizationId?: string,
  env?: any,
): Promise<{
  systemPermissions: Permission[]
  organizationPermissions: Permission[]
  allPermissions: Permission[]
}> {
  if (!env) {
    return { systemPermissions: [], organizationPermissions: [], allPermissions: [] }
  }
  const { db } = createDb(env)

  // Get user with system role
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  let systemPermissions: Permission[] = []
  if (user?.role) {
    const { getDefaultPermissionsForUserRole } = await import('../shared')
    systemPermissions = getDefaultPermissionsForUserRole(user.role as UserRole)
  }

  let organizationPermissions: Permission[] = []
  if (organizationId) {
    const member = await db.query.members.findFirst({
      where: and(
        eq(members.userId, userId),
        eq(members.organizationId, organizationId),
      ),
    })

    if (member?.role) {
      const { getDefaultPermissionsForOrganizationRole } = await import('../shared')
      organizationPermissions = getDefaultPermissionsForOrganizationRole(member.role as OrganizationRole)
    }
  }

  return {
    systemPermissions,
    organizationPermissions,
    allPermissions: combinePermissions(systemPermissions, organizationPermissions),
  }
}

/**
 * Check if user can perform action on their own resource
 */
export async function canManageOwnResource(
  userId: string,
  resourceUserId: string,
  permission: Permission,
  organizationId?: string,
  env?: any,
): Promise<boolean> {
  // If it's their own resource and they have edit-own permission
  if (userId === resourceUserId) {
    const ownPermissions = [
      PERMISSIONS.CONTENT_EDIT_OWN,
      PERMISSIONS.USER_UPDATE,
    ] as const

    if (ownPermissions.includes(permission as any)) {
      const userPermissions = await getUserPermissions(userId, organizationId, env)
      return hasPermission(userPermissions, permission)
    }
  }

  // Otherwise check if they have the full permission
  return await userHasPermission(userId, permission, organizationId, env)
}
