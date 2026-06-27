import type { AuthUser } from '../services/auth'

export function getPostLoginPath(user: AuthUser): string {
  if (user.role === 'admin') return '/admin'
  if (user.role === 'student') return '/dashboard/student/explore'
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
