import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import type { AuthUser } from '../../services/auth'
import { getPostLoginPath } from '../../utils/authRouting'

import { AuthLoadingSkeleton } from './AuthLoadingSkeleton'

// VERIFIED: route guards — login redirect, verified teacher gate, admin-only routes
function AuthLoading() {
  return <AuthLoadingSkeleton />
}

export function RequireRole({ roles }: { roles: AuthUser['role'][] }) {
  const { user, authLoading } = useApp()
  const location = useLocation()

  if (authLoading) return <AuthLoading />
  if (!user) return <Navigate to="/auth/role" state={{ from: location.pathname }} replace />
  if (!roles.includes(user.role)) {
    return <Navigate to={getPostLoginPath(user)} replace />
  }

  return <Outlet />
}

export function RequireVerifiedTeacher() {
  const { user, authLoading } = useApp()
  const location = useLocation()

  if (authLoading) return <AuthLoading />
  if (!user) return <Navigate to="/auth/teacher" state={{ from: location.pathname }} replace />
  if (user.role !== 'teacher') {
    return <Navigate to={getPostLoginPath(user)} replace />
  }
  if (user.teacherStatus !== 'verified') {
    return <Navigate to="/auth/teacher/pending" replace />
  }

  return <Outlet />
}

export function RequireGuest() {
  const { user, authLoading } = useApp()

  if (authLoading) return <AuthLoading />
  if (user) return <Navigate to={getPostLoginPath(user)} replace />

  return <Outlet />
}
