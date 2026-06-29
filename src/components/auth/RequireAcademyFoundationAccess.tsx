import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { hasAcademyRouteAccess } from '../../domain/academy/permissions'
import { getPostLoginPath } from '../../utils/authRouting'
import { AuthLoadingSkeleton } from '../auth/AuthLoadingSkeleton'

/** Allows teachers and admins to access reserved academy routes during foundation phase. */
export function RequireAcademyFoundationAccess() {
  const { user, authLoading } = useApp()
  const location = useLocation()

  if (authLoading) return <AuthLoadingSkeleton />
  if (!user) {
    return <Navigate to="/auth/role" state={{ from: location.pathname }} replace />
  }
  if (!hasAcademyRouteAccess(user.role)) {
    return <Navigate to={getPostLoginPath(user)} replace />
  }

  return <Outlet />
}
