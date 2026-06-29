import type { AuthUser } from '../services/auth'
import {
  DASHBOARD_VIEW_PATHS,
  getDashboardViewsForUser,
  type DashboardView,
} from './dashboardRoutes'
import { getPostLoginPath } from './authRouting'

const STORAGE_KEY = 'yogstra_workspace_view'

export function getRememberedWorkspace(): DashboardView | null {
  const value = localStorage.getItem(STORAGE_KEY)
  if (
    value === 'admin' ||
    value === 'student' ||
    value === 'teacher' ||
    value === 'academy' ||
    value === 'organizer' ||
    value === 'judge'
  ) {
    return value
  }
  return null
}

export function rememberWorkspace(view: DashboardView) {
  localStorage.setItem(STORAGE_KEY, view)
}

export function clearRememberedWorkspace() {
  localStorage.removeItem(STORAGE_KEY)
}

/** After login — workspace picker when multiple dashboards are available. */
export function resolvePostLoginPath(user: AuthUser): string {
  const views = getDashboardViewsForUser(user)
  if (views.length === 0) return getPostLoginPath(user)
  if (views.length === 1) return DASHBOARD_VIEW_PATHS[views[0]]

  const remembered = getRememberedWorkspace()
  if (remembered && views.includes(remembered)) {
    return DASHBOARD_VIEW_PATHS[remembered]
  }

  return '/auth/workspace'
}
