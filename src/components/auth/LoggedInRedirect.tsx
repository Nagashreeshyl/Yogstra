import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import type { AuthUser } from '../../services/auth'
import { getPostLoginPath } from '../../utils/authRouting'
import { isPlatformAdmin } from '../../utils/platformAdmin'
import { AuthLoadingSkeleton } from './AuthLoadingSkeleton'

const STUDENT_PUBLIC: Record<string, string> = {
  '/': '/dashboard/student',
  '/discover': '/dashboard/student/explore',
  '/explore': '/dashboard/student/explore',
  '/community': '/dashboard/student/community',
  '/teachers': '/dashboard/student/teachers',
  '/academies': '/dashboard/student/explore',
  '/competitions': '/dashboard/student/competitions',
}

const AUTH_PATHS = [
  '/auth/role',
  '/auth/get-started',
  '/auth/student',
  '/auth/academy',
  '/auth/organizer',
  '/auth/teacher',
  '/auth/teacher/register',
  '/auth/login',
]

const PUBLIC_BROWSABLE_EXACT = new Set([
  '/',
  '/discover',
  '/explore',
  '/teachers',
  '/academies',
  '/competitions',
  '/community',
  '/help',
  '/about',
  '/how-it-works',
  '/privacy-policy',
  '/terms-of-service',
  '/refund-policy',
])

function isPublicBrowsablePath(path: string): boolean {
  if (PUBLIC_BROWSABLE_EXACT.has(path)) return true
  if (path.startsWith('/teachers/')) return true
  if (path.startsWith('/academies/')) return true
  if (path.startsWith('/competitions/')) return true
  if (path.startsWith('/students/')) return true
  return false
}

function isUnverifiedTeacher(user: AuthUser): boolean {
  return user.role === 'teacher' && user.teacherStatus !== 'verified'
}

/** Sends returning logged-in users to their dashboard instead of public/auth pages */
export function LoggedInRedirect({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp()
  const location = useLocation()

  if (authLoading) {
    return <AuthLoadingSkeleton />
  }

  if (!user) return children

  const dashboard = getPostLoginPath(user)
  const path = location.pathname

  if (AUTH_PATHS.includes(path)) {
    return <Navigate to={dashboard} replace />
  }

  if (user.role === 'student') {
    const target = STUDENT_PUBLIC[path]
    if (target) return <Navigate to={target} replace />
    if (path.startsWith('/teachers/') && !path.startsWith('/dashboard/')) {
      return <Navigate to={`/dashboard/student${path}`} replace />
    }
    const studentProfileMatch = path.match(/^\/students\/([^/]+)$/)
    if (studentProfileMatch) {
      return <Navigate to={`/dashboard/student/students/${studentProfileMatch[1]}`} replace />
    }
  }

  if (user.role === 'teacher') {
    // Pending teachers can browse the public site (Browse Yogstra)
    if (isUnverifiedTeacher(user) && isPublicBrowsablePath(path)) {
      return children
    }
    if (path === '/' || path.startsWith('/teachers') || path === '/community' || path === '/discover') {
      return <Navigate to={dashboard} replace />
    }
    const studentProfileMatch = path.match(/^\/students\/([^/]+)$/)
    if (studentProfileMatch) {
      return <Navigate to={`/dashboard/teacher/students/${studentProfileMatch[1]}`} replace />
    }
  }

  if (isPlatformAdmin(user)) {
    if (path === '/' || AUTH_PATHS.includes(path)) {
      return <Navigate to="/admin" replace />
    }
  }

  return children
}
