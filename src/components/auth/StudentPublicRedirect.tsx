import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const PUBLIC_TO_DASHBOARD: Record<string, string> = {
  '/': '/dashboard/student/explore',
  '/community': '/dashboard/student/community',
  '/teachers': '/dashboard/student/teachers',
  '/competitions': '/dashboard/student/competitions',
  '/shop': '/dashboard/student/shop',
}

/** Keeps logged-in students inside the single dashboard shell */
export function StudentPublicRedirect({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp()
  const location = useLocation()

  if (authLoading) return null

  if (user?.role === 'student') {
    const target = PUBLIC_TO_DASHBOARD[location.pathname]
    if (target) {
      return <Navigate to={target} replace />
    }

    if (location.pathname.startsWith('/teachers/')) {
      return <Navigate to={`/dashboard/student${location.pathname}`} replace />
    }
  }

  return children
}
