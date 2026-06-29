import { useApp } from '../context/AppContext'
import { useAsyncData } from './useAsyncData'
import {
  fetchWorkspaceAccess,
  getDashboardViewsForAccess,
  type WorkspaceAccess,
} from '../services/workspaceAccess'
import { isVerifiedTeacher } from '../utils/authRouting'
import type { DashboardView } from '../utils/dashboardRoutes'

export function useWorkspaceAccess(): {
  access: WorkspaceAccess | null
  views: DashboardView[]
  loading: boolean
} {
  const { user } = useApp()
  const enabled = Boolean(user && isVerifiedTeacher(user))

  const { data, loading } = useAsyncData(
    () => (user ? fetchWorkspaceAccess(user.id) : Promise.resolve(null)),
    [user?.id],
    { enabled },
  )

  const views = user ? getDashboardViewsForAccess(user, data) : []

  return { access: data, views, loading: enabled && loading }
}
