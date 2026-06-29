import type { AuthUser } from '../services/auth'
import { isPlatformAdmin } from './platformAdmin'

export type DashboardView =
  | 'admin'
  | 'student'
  | 'teacher'
  | 'academy'
  | 'organizer'
  | 'judge'

export const DASHBOARD_VIEW_PATHS: Record<DashboardView, string> = {
  admin: '/admin',
  student: '/dashboard/student',
  teacher: '/dashboard/teacher',
  academy: '/dashboard/academy',
  organizer: '/dashboard/organizer',
  judge: '/dashboard/judge',
}

export function getDashboardViewsForUser(user: AuthUser): DashboardView[] {
  if (isPlatformAdmin(user)) {
    return ['admin', 'student', 'teacher', 'academy', 'organizer', 'judge']
  }
  if (user.role === 'teacher') {
    return ['teacher', 'academy', 'organizer', 'judge']
  }
  if (user.role === 'student') {
    return ['student']
  }
  return []
}

export function detectActiveDashboardView(pathname: string): DashboardView | null {
  if (pathname.startsWith('/admin')) return 'admin'
  if (pathname.startsWith('/dashboard/student')) return 'student'
  if (pathname.startsWith('/dashboard/teacher')) return 'teacher'
  if (pathname.startsWith('/dashboard/academy')) return 'academy'
  if (pathname.startsWith('/dashboard/organizer')) return 'organizer'
  if (pathname.startsWith('/dashboard/judge')) return 'judge'
  return null
}

export function formatDashboardViewLabel(view: DashboardView): string {
  return view.charAt(0).toUpperCase() + view.slice(1)
}
