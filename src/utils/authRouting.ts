import type { AuthUser } from '../services/auth'
import { isPlatformAdmin } from './platformAdmin'

export function getPostLoginPath(user: AuthUser): string {
  if (isPlatformAdmin(user)) return '/admin'
  if (user.role === 'student') return '/dashboard/student'
  if (user.role === 'teacher') {
    return user.teacherStatus === 'verified' ? '/dashboard/teacher' : '/auth/teacher/pending'
  }
  return '/'
}

export function getDashboardPath(user: AuthUser): string {
  return getPostLoginPath(user)
}

export function isVerifiedTeacher(user: AuthUser | null): boolean {
  return user?.role === 'teacher' && user.teacherStatus === 'verified'
}

export function formatRoleLabel(user: AuthUser): string {
  const role = user.role.charAt(0).toUpperCase() + user.role.slice(1)
  if (user.role === 'teacher' && user.teacherStatus === 'pending') {
    return `${role} (unverified)`
  }
  return role
}
