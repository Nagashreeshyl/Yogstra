import { NavLink, Link } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { InstallAppPrompt } from '../pwa/InstallAppPrompt'
import type { NavBadgeKey, ShellNavItem, ShellVariant } from './types'

interface SidebarProps {
  variant: ShellVariant
  title: string
  homeLink: string
  navItems: ShellNavItem[]
  badges: Partial<Record<NavBadgeKey, number>>
  footer?: React.ReactNode
}

function NavBadge({
  value,
  badgeKey,
  unreadTotal,
}: {
  value?: string
  badgeKey?: NavBadgeKey
  unreadTotal?: number
}) {
  if (value) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-[8px] border border-sidebar-border text-sidebar-muted">
        {value}
      </span>
    )
  }
  if (badgeKey && unreadTotal && unreadTotal > 0) {
    return (
      <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold">
        {unreadTotal > 99 ? '99+' : unreadTotal}
      </span>
    )
  }
  return null
}

export function Sidebar({
  variant,
  title,
  homeLink,
  navItems,
  badges,
  footer,
}: SidebarProps) {
  const { isLoggedIn, setShowRoleModal, authLoading } = useApp()
  const sidebarItems = navItems.filter((item) => item.placement.includes('sidebar'))

  return (
    <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col h-full border-r border-sidebar-border">
      <div className="px-6 py-5 border-b border-sidebar-border">
        <Link to={homeLink} className="block">
          <h1 className="font-heading text-xl font-semibold tracking-tight">{title}</h1>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-sidebar-active text-sidebar-foreground font-medium'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover'
              }`
            }
          >
            <item.icon size={18} strokeWidth={1.75} aria-hidden />
            <span className="flex-1 truncate">{item.label}</span>
            <NavBadge
              value={item.badge}
              badgeKey={item.badgeKey}
              unreadTotal={item.badgeKey ? badges[item.badgeKey] : undefined}
            />
          </NavLink>
        ))}
      </nav>

      {footer && (
        <div className="px-4 py-3 border-t border-sidebar-border text-xs space-y-1">
          {footer}
        </div>
      )}

      <div className="p-4 border-t border-sidebar-border pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
        <InstallAppPrompt variant="sidebar" />
        {!authLoading && !isLoggedIn && variant === 'public' && (
          <div className="space-y-1 px-1">
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover rounded-[12px] transition-colors cursor-pointer"
            >
              <LogIn size={16} />
              Login
            </button>
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-active rounded-[12px] transition-colors cursor-pointer"
            >
              <UserPlus size={16} />
              Sign up
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
