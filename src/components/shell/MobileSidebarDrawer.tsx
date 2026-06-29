import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import type { NavBadgeKey, ShellNavItem } from './types'

interface MobileSidebarDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  navItems: ShellNavItem[]
  badges: Partial<Record<NavBadgeKey, number>>
  footer?: React.ReactNode
}

export function MobileSidebarDrawer({
  open,
  onClose,
  title,
  navItems,
  badges,
  footer,
}: MobileSidebarDrawerProps) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const sidebarItems = navItems.filter((item) => item.placement.includes('sidebar'))

  return (
    <div className="lg:hidden fixed inset-0 z-[75]" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
        aria-label="Close navigation menu"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 left-0 w-[min(100%,280px)] bg-sidebar text-sidebar-foreground shadow-md flex flex-col pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border pt-[max(1rem,env(safe-area-inset-top))]">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -mr-2 rounded-[12px] text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover cursor-pointer"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1" aria-label="Main navigation">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-[12px] text-sm transition-colors ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-foreground font-medium'
                    : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-hover'
                }`
              }
            >
              <item.icon size={18} strokeWidth={1.75} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-[8px] border border-sidebar-border text-sidebar-muted">
                  {item.badge}
                </span>
              )}
              {item.badgeKey && badges[item.badgeKey] ? (
                <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {badges[item.badgeKey]! > 99 ? '99+' : badges[item.badgeKey]}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        {footer && (
          <div className="px-4 py-3 border-t border-sidebar-border text-xs space-y-2 text-sidebar-muted">
            {footer}
          </div>
        )}
      </aside>
    </div>
  )
}
