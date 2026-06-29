import { supabase } from '../lib/supabase'
import type { AuthUser } from './auth'
import type { DashboardView } from '../utils/dashboardRoutes'
import { isPlatformAdmin } from '../utils/platformAdmin'
import { isVerifiedTeacher } from '../utils/authRouting'

export type WorkspaceAccess = {
  coach: boolean
  academy: boolean
  competitions: boolean
  judge: boolean
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
  const judgeCount = await fetchJudgeAssignmentCount(userId)
  return {
    coach: true,
    academy: true,
    competitions: true,
    judge: judgeCount > 0,
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
