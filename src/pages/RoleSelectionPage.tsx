import { Navigate } from 'react-router-dom'

/** @deprecated Use /auth/get-started — kept for backward-compatible redirects */
export function RoleSelectionPage() {
  return <Navigate to="/auth/get-started" replace />
}
