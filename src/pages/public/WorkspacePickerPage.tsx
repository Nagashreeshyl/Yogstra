import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, GraduationCap, Gavel, Scale, Shield } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { AuthLayout } from '../../components/public/AuthLayout'
import { Button } from '../../components/ui/Button'
import {
  DASHBOARD_VIEW_PATHS,
  formatDashboardViewLabel,
  getDashboardViewsForUser,
  type DashboardView,
} from '../../utils/dashboardRoutes'
import { rememberWorkspace } from '../../utils/workspacePreference'
import { getPostLoginPath } from '../../utils/authRouting'

const viewIcons: Record<DashboardView, typeof GraduationCap> = {
  student: GraduationCap,
  teacher: Shield,
  academy: Building2,
  organizer: Gavel,
  judge: Scale,
  admin: Shield,
}

export function WorkspacePickerPage() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<DashboardView | null>(null)
  const [remember, setRemember] = useState(true)

  if (!user) {
    navigate('/auth/login', { replace: true })
    return null
  }

  const views = getDashboardViewsForUser(user)

  if (views.length <= 1) {
    navigate(getPostLoginPath(user), { replace: true })
    return null
  }

  const handleContinue = () => {
    if (!selected) return
    if (remember) rememberWorkspace(selected)
    navigate(DASHBOARD_VIEW_PATHS[selected])
  }

  return (
    <AuthLayout title="Choose workspace" description="Select where you want to go today.">
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
