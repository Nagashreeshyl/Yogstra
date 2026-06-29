import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, GraduationCap, Gavel, LayoutGrid, Scale } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { AuthLayout } from '../../components/public/AuthLayout'
import { Button } from '../../components/ui/Button'
import {
  DASHBOARD_VIEW_PATHS,
  formatDashboardViewLabel,
  getDashboardViewsForUser,
  type DashboardView,
} from '../../utils/dashboardRoutes'
import { rememberWorkspace, persistWorkspaceChoice } from '../../utils/workspacePreference'
import { getPostLoginPath } from '../../utils/authRouting'
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess'

const viewIcons: Record<DashboardView, typeof GraduationCap> = {
  student: GraduationCap,
  teacher: LayoutGrid,
  academy: Building2,
  organizer: Gavel,
  judge: Scale,
  admin: LayoutGrid,
}

export function WorkspacePickerPage() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<DashboardView | null>(null)
  const [remember, setRemember] = useState(true)
  const { views: workspaceViews, loading } = useWorkspaceAccess()

  if (!user) {
    navigate('/auth/login', { replace: true })
    return null
  }

  const views = workspaceViews.length > 0 ? workspaceViews : getDashboardViewsForUser(user)

  if (!loading && views.length <= 1) {
    navigate(getPostLoginPath(user), { replace: true })
    return null
  }

  const handleContinue = () => {
    if (!selected || !user) return
    if (remember) {
      rememberWorkspace(selected)
      void persistWorkspaceChoice(user.id, selected)
    }
    navigate(DASHBOARD_VIEW_PATHS[selected])
  }

  return (
    <AuthLayout
      title="Choose a workspace"
      description="One account — switch between your coaching, academy, competition, and judge workspaces."
    >
      <div className="space-y-3">
        {views.map((view) => {
          const Icon = viewIcons[view]
          const active = selected === view
          return (
            <button
              key={view}
              type="button"
              onClick={() => setSelected(view)}
              className={`flex w-full items-center gap-4 rounded-[16px] border p-4 text-left transition-colors cursor-pointer ${
                active
                  ? 'border-accent bg-accent/10'
                  : 'border-border bg-elevated hover:border-accent/30'
              }`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-muted">
                <Icon size={20} className="text-accent" />
              </span>
              <span className="font-medium text-foreground">{formatDashboardViewLabel(view)}</span>
            </button>
          )
        })}
      </div>

      <label className="mt-6 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="rounded border-border accent-accent"
        />
        Remember my choice
      </label>

      <Button className="w-full mt-6" disabled={!selected} onClick={handleContinue}>
        Continue
      </Button>
    </AuthLayout>
  )
}
