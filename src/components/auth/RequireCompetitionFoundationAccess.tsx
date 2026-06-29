import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { hasCompetitionRouteAccess } from '../../domain/competition/permissions'
import { getPostLoginPath } from '../../utils/authRouting'
import { AuthLoadingSkeleton } from '../auth/AuthLoadingSkeleton'

/** Allows authenticated students, teachers, and admins to access reserved competition routes. */
export function RequireCompetitionFoundationAccess() {
  const { user, authLoading } = useApp()
  const location = useLocation()

  if (authLoading) return <AuthLoadingSkeleton />
  if (!user) {
    return <Navigate to="/auth/role" state={{ from: location.pathname }} replace />
  }
  if (!hasCompetitionRouteAccess(user.role)) {
    return <Navigate to={getPostLoginPath(user)} replace />
  }

  return <Outlet />
}
