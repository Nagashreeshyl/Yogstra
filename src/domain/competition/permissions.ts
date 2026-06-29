import type { UserRole } from '../../types'
import type {
  CompetitionRegistrantType,
  CompetitionStatus,
} from './models'

/** Platform-level roles — unchanged from existing auth. */
export type PlatformRole = Exclude<UserRole, null>

/** Future platform roles reserved for V2 auth module. */
export type FuturePlatformRole = PlatformRole | 'academy_admin' | 'organizer' | 'judge'

export type CompetitionActorRole =
  | 'student'
  | 'teacher'
  | 'academy'
  | 'judge'
  | 'organizer'
  | 'admin'

export const COMPETITION_PUBLIC_STATUSES: CompetitionStatus[] = [
  'published',
  'registration_open',
  'registration_closed',
  'in_progress',
  'scoring',
  'results_pending',
  'completed',
]

export const COMPETITION_REGISTRATION_OPEN_STATUSES: CompetitionStatus[] = ['registration_open']

export interface CompetitionPermissionContext {
  platformRole: PlatformRole
  isPlatformAdmin: boolean
  isOrganizer: boolean
  isJudge: boolean
  isParticipant: boolean
  isAcademyManager: boolean
  registrantType: CompetitionRegistrantType | null
}

export function buildCompetitionPermissionContext(params: {
  platformRole: PlatformRole
  isOrganizer?: boolean
  isJudge?: boolean
  isParticipant?: boolean
  isAcademyManager?: boolean
  registrantType?: CompetitionRegistrantType | null
}): CompetitionPermissionContext {
  return {
    platformRole: params.platformRole,
    isPlatformAdmin: params.platformRole === 'admin',
    isOrganizer: params.isOrganizer ?? false,
    isJudge: params.isJudge ?? false,
    isParticipant: params.isParticipant ?? false,
    isAcademyManager: params.isAcademyManager ?? false,
    registrantType: params.registrantType ?? null,
  }
}

export function canViewCompetition(
  ctx: CompetitionPermissionContext,
  status: CompetitionStatus,
): boolean {
  if (ctx.isPlatformAdmin) return true
  if (ctx.isOrganizer || ctx.isJudge || ctx.isParticipant) return true
  return COMPETITION_PUBLIC_STATUSES.includes(status)
}

export function canManageCompetition(ctx: CompetitionPermissionContext): boolean {
  return ctx.isPlatformAdmin || ctx.isOrganizer || ctx.isAcademyManager
}

export function canRegisterForCompetition(
  ctx: CompetitionPermissionContext,
  status: CompetitionStatus,
): boolean {
  if (!COMPETITION_REGISTRATION_OPEN_STATUSES.includes(status)) return false
  if (ctx.isPlatformAdmin || ctx.isOrganizer) return true
  return ctx.platformRole === 'student' || ctx.platformRole === 'teacher'
}

export function canRegisterStudents(ctx: CompetitionPermissionContext): boolean {
  if (ctx.isPlatformAdmin || ctx.isOrganizer) return true
  return ctx.platformRole === 'teacher' || ctx.isAcademyManager
}

export function canBulkRegister(ctx: CompetitionPermissionContext): boolean {
  return ctx.isPlatformAdmin || ctx.isOrganizer || ctx.isAcademyManager
}

export function canScoreCompetition(ctx: CompetitionPermissionContext): boolean {
  return ctx.isPlatformAdmin || ctx.isJudge
}

export function canApproveResults(ctx: CompetitionPermissionContext): boolean {
  return ctx.isPlatformAdmin || ctx.isOrganizer
}

export function canIssueCertificates(ctx: CompetitionPermissionContext): boolean {
  return ctx.isPlatformAdmin || ctx.isOrganizer
}

export function canViewRankings(_ctx: CompetitionPermissionContext): boolean {
  return true
}

export function canManageRankings(ctx: CompetitionPermissionContext): boolean {
  return ctx.isPlatformAdmin || ctx.isOrganizer
}

export function hasCompetitionRouteAccess(platformRole: PlatformRole): boolean {
  return (
    platformRole === 'student' ||
    platformRole === 'teacher' ||
    platformRole === 'admin'
  )
}

export function hasJudgeRouteAccess(ctx: CompetitionPermissionContext): boolean {
  return ctx.isPlatformAdmin || ctx.isJudge || ctx.platformRole === 'teacher'
}

export function hasOrganizerRouteAccess(ctx: CompetitionPermissionContext): boolean {
  return ctx.isPlatformAdmin || ctx.isOrganizer || ctx.platformRole === 'teacher'
}

export function inferRegistrantType(platformRole: PlatformRole): CompetitionRegistrantType {
  if (platformRole === 'teacher') return 'teacher'
  if (platformRole === 'admin') return 'organizer'
  return 'student'
}

export function formatCompetitionStatus(status: CompetitionStatus): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatRankingScope(scope: string): string {
  return scope.charAt(0).toUpperCase() + scope.slice(1)
}
