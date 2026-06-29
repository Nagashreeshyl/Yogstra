import { supabase } from '../lib/supabase'
import type { AuthUser } from './auth'
import { fetchAcademiesForUser } from './academyService'
import { fetchOrganizerCompetitions } from './competitionService'
import type { DashboardView } from '../utils/dashboardRoutes'
import { isPlatformAdmin } from '../utils/platformAdmin'
import { isVerifiedTeacher } from '../utils/authRouting'

export type WorkspaceAccess = {
  coach: boolean
  academy: boolean
  competitions: boolean
  judge: boolean
  ownsAcademy: boolean
  ownsCompetitions: boolean
  academyCount: number
  competitionCount: number
}

export async function fetchJudgeAssignmentCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('competition_judges')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'removed')

  if (error) throw error
  return count ?? 0
}

export async function fetchWorkspaceAccess(userId: string): Promise<WorkspaceAccess> {
  const [judgeCount, academies, competitions] = await Promise.all([
    fetchJudgeAssignmentCount(userId),
    fetchAcademiesForUser(userId).catch(() => []),
    fetchOrganizerCompetitions(userId).catch(() => []),
  ])

  const activeAcademies = academies.filter((a) => a.status === 'active')
  const activeCompetitions = competitions.filter((c) => c.status !== 'archived')

  return {
    coach: true,
    academy: true,
    competitions: true,
    judge: judgeCount > 0,
    ownsAcademy: activeAcademies.length > 0,
    ownsCompetitions: activeCompetitions.length > 0,
    academyCount: activeAcademies.length,
    competitionCount: activeCompetitions.length,
  }
}

export function getDashboardViewsForAccess(user: AuthUser, access: WorkspaceAccess | null): DashboardView[] {
  if (isPlatformAdmin(user)) {
    return ['admin', 'student', 'teacher', 'academy', 'organizer', 'judge']
  }
  if (user.role === 'student') {
    return ['student']
  }
  if (user.role === 'teacher') {
    if (!isVerifiedTeacher(user)) return []
    if (!access) return ['teacher', 'academy', 'organizer']
    const views: DashboardView[] = []
    if (access.coach) views.push('teacher')
    if (access.academy) views.push('academy')
    if (access.competitions) views.push('organizer')
    if (access.judge) views.push('judge')
    return views
  }
  return []
}

/** Preferred workspace when no saved preference exists. */
export function inferDefaultWorkspace(access: WorkspaceAccess): DashboardView {
  if (access.ownsAcademy) return 'academy'
  if (access.ownsCompetitions) return 'organizer'
  if (access.judge) return 'judge'
  return 'teacher'
}
