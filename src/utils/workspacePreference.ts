import type { AuthUser } from '../services/auth'
import {
  fetchProfilePreferences,
  saveProfilePreferences,
} from '../services/profilePreferencesService'
import {
  fetchWorkspaceAccess,
  getDashboardViewsForAccess,
  inferDefaultWorkspace,
} from '../services/workspaceAccess'
import { isVerifiedTeacher } from './authRouting'
import {
  DASHBOARD_VIEW_PATHS,
  getDashboardViewsForUser,
  type DashboardView,
} from './dashboardRoutes'
import { getPostLoginPath } from './authRouting'
import { isPlatformAdmin } from './platformAdmin'

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

/** Persist workspace choice to localStorage and database. */
export async function persistWorkspaceChoice(userId: string, view: DashboardView) {
  rememberWorkspace(view)
  try {
    await saveProfilePreferences(userId, { preferredWorkspace: view })
  } catch {
    /* DB may be unavailable before migration — localStorage still works */
  }
}

async function resolveViews(user: AuthUser): Promise<DashboardView[]> {
  if (user.role === 'teacher' && isVerifiedTeacher(user)) {
    const access = await fetchWorkspaceAccess(user.id)
    return getDashboardViewsForAccess(user, access)
  }
  return getDashboardViewsForUser(user)
}

/** After login — smart workspace routing with DB persistence. */
export async function resolvePostLoginPath(user: AuthUser): Promise<string> {
  const views = await resolveViews(user)
  if (views.length === 0) return getPostLoginPath(user)
  if (views.length === 1) return DASHBOARD_VIEW_PATHS[views[0]]

  let dbWorkspace: DashboardView | null = null
  try {
    const prefs = await fetchProfilePreferences(user.id)
    dbWorkspace = prefs?.preferredWorkspace ?? null
  } catch {
    /* fall through */
  }

  if (dbWorkspace && views.includes(dbWorkspace)) {
    return DASHBOARD_VIEW_PATHS[dbWorkspace]
  }

  const remembered = getRememberedWorkspace()
  if (remembered && views.includes(remembered)) {
    return DASHBOARD_VIEW_PATHS[remembered]
  }

  if (user.role === 'teacher' && isVerifiedTeacher(user)) {
    const access = await fetchWorkspaceAccess(user.id)
    const inferred = inferDefaultWorkspace(access)
    if (views.includes(inferred)) {
      return DASHBOARD_VIEW_PATHS[inferred]
    }
  }

  if (isPlatformAdmin(user)) {
    return '/admin'
  }

  return '/auth/workspace'
}

/** Synchronous fallback for redirects that cannot await. */
export function resolvePostLoginPathSync(user: AuthUser): string {
  const views = getDashboardViewsForUser(user)
  if (views.length === 0) return getPostLoginPath(user)
  if (views.length === 1) return DASHBOARD_VIEW_PATHS[views[0]]

  const remembered = getRememberedWorkspace()
  if (remembered && views.includes(remembered)) {
    return DASHBOARD_VIEW_PATHS[remembered]
  }

  if (isPlatformAdmin(user)) return '/admin'
  return getPostLoginPath(user)
}
