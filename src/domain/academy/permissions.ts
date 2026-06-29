import type { UserRole } from '../../types'
import type { AcademyMemberRole } from './models'

/** Platform-level roles — unchanged from existing auth. */
export type PlatformRole = Exclude<UserRole, null>

/** Future platform roles reserved for V2 auth module. */
export type FuturePlatformRole = PlatformRole | 'academy_admin' | 'organizer' | 'judge'

export const ACADEMY_MANAGEMENT_ROLES: AcademyMemberRole[] = ['owner', 'manager']

export const ACADEMY_TEACHING_ROLES: AcademyMemberRole[] = [
  'owner',
  'manager',
  'teacher',
  'assistant_teacher',
]

export const ACADEMY_FINANCE_ROLES: AcademyMemberRole[] = [
  'owner',
  'manager',
  'finance_manager',
]

export const ACADEMY_FRONT_DESK_ROLES: AcademyMemberRole[] = [
  'owner',
  'manager',
  'receptionist',
]

export interface AcademyPermissionContext {
  platformRole: PlatformRole
  academyMemberRole: AcademyMemberRole | null
  isAcademyTeacher: boolean
  isPlatformAdmin: boolean
}

export function buildAcademyPermissionContext(params: {
  platformRole: PlatformRole
  academyMemberRole?: AcademyMemberRole | null
  isAcademyTeacher?: boolean
}): AcademyPermissionContext {
  return {
    platformRole: params.platformRole,
    academyMemberRole: params.academyMemberRole ?? null,
    isAcademyTeacher: params.isAcademyTeacher ?? false,
    isPlatformAdmin: params.platformRole === 'admin',
  }
}

export function canViewAcademy(ctx: AcademyPermissionContext): boolean {
  return (
    ctx.isPlatformAdmin ||
    ctx.academyMemberRole !== null ||
    ctx.isAcademyTeacher
  )
}

export function canManageAcademy(ctx: AcademyPermissionContext): boolean {
  if (ctx.isPlatformAdmin) return true
  if (!ctx.academyMemberRole) return false
  return ACADEMY_MANAGEMENT_ROLES.includes(ctx.academyMemberRole)
}

export function canManageAcademyTeachers(ctx: AcademyPermissionContext): boolean {
  return canManageAcademy(ctx)
}

export function canManageAcademyBatches(ctx: AcademyPermissionContext): boolean {
  if (ctx.isPlatformAdmin) return true
  if (!ctx.academyMemberRole) return ctx.isAcademyTeacher
  return (
    ACADEMY_MANAGEMENT_ROLES.includes(ctx.academyMemberRole) ||
    ACADEMY_TEACHING_ROLES.includes(ctx.academyMemberRole)
  )
}

export function canManageAcademyFinance(ctx: AcademyPermissionContext): boolean {
  if (ctx.isPlatformAdmin) return true
  if (!ctx.academyMemberRole) return false
  return ACADEMY_FINANCE_ROLES.includes(ctx.academyMemberRole)
}

export function canManageAcademyStudents(ctx: AcademyPermissionContext): boolean {
  if (ctx.isPlatformAdmin) return true
  if (!ctx.academyMemberRole) return false
  return (
    ACADEMY_MANAGEMENT_ROLES.includes(ctx.academyMemberRole) ||
    ctx.academyMemberRole === 'receptionist'
  )
}

export function hasAcademyRouteAccess(platformRole: PlatformRole): boolean {
  return platformRole === 'admin' || platformRole === 'teacher'
}

export function formatAcademyMemberRole(role: AcademyMemberRole): string {
  return role
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
