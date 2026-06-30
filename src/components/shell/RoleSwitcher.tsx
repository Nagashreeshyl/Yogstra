import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, LayoutGrid } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import {
  DASHBOARD_VIEW_PATHS,
  detectActiveDashboardView,
  formatDashboardViewLabel,
  getDashboardViewsForUser,
  type DashboardView,
} from '../../utils/dashboardRoutes'
import { formatRoleLabel } from '../../utils/authRouting'
import { isPlatformAdmin } from '../../utils/platformAdmin'
import { useWorkspaceAccess } from '../../hooks/useWorkspaceAccess'
import { persistWorkspaceChoice } from '../../utils/workspacePreference'

export function RoleSwitcher({ compactOnMobile = false }: { compactOnMobile?: boolean }) {
  const { user, isLoggedIn } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { views: workspaceViews } = useWorkspaceAccess()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  if (!isLoggedIn || !user) return null

  const isAdmin = isPlatformAdmin(user)
  const availableViews = workspaceViews.length > 0 ? workspaceViews : getDashboardViewsForUser(user)
  const activeView = detectActiveDashboardView(location.pathname)
  const label = activeView
    ? formatDashboardViewLabel(activeView)
    : formatRoleLabel(user)

  const handleSelect = (view: DashboardView) => {
    setOpen(false)
    if (user) void persistWorkspaceChoice(user.id, view)
    navigate(DASHBOARD_VIEW_PATHS[view])
  }

  if (!isAdmin && availableViews.length <= 1) return null

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`inline-flex items-center gap-1.5 h-9 rounded-[12px] border border-border bg-elevated text-sm text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          compactOnMobile ? 'w-9 justify-center px-0 sm:w-auto sm:px-3' : 'px-2.5 sm:px-3'
        }`}
        aria-label={compactOnMobile ? `Switch workspace: ${label}` : 'Switch workspace'}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <LayoutGrid size={14} className="text-accent shrink-0" />
        <span className={`truncate ${compactOnMobile ? 'hidden sm:inline sm:max-w-none' : 'max-w-[5.5rem] sm:max-w-none'}`}>
          {label}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground shrink-0 ${compactOnMobile ? 'hidden sm:block' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Workspaces"
          className="absolute right-0 top-full mt-2 w-56 max-w-[min(14rem,calc(100vw-2rem))] sm:max-w-none rounded-[16px] border border-border bg-elevated shadow-md py-2 z-[85] max-lg:fixed max-lg:right-4 max-lg:left-auto max-lg:top-[calc(3.5rem+env(safe-area-inset-top))] max-lg:mt-0 max-lg:w-[min(14rem,calc(100vw-2rem))]"
        >
          <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isAdmin ? 'Admin — switch workspace' : 'Workspaces'}
          </p>
          {availableViews.map((view) => {
            const isActive = activeView === view
            return (
              <button
                key={view}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(view)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'text-foreground bg-primary/10 font-medium'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {formatDashboardViewLabel(view)}
                {isActive && (
                  <span className="text-[10px] uppercase tracking-wide text-primary font-medium">Active</span>
                )}
              </button>
            )
          })}
          {isAdmin && (
            <p className="px-3 pt-2 pb-1 text-[11px] text-muted-foreground border-t border-border mt-1">
              Preview any workspace without changing your admin account.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
