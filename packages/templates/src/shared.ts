/**
 * Shared constants and types for the templates package
 */

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

export const ORGANIZATION_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
} as const;

export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type OrganizationRole = typeof ORGANIZATION_ROLES[keyof typeof ORGANIZATION_ROLES];
export type InvitationStatus = typeof INVITATION_STATUS[keyof typeof INVITATION_STATUS];