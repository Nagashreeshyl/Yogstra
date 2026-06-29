import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal, X } from 'lucide-react'
import type { NavBadgeKey, ShellNavItem } from './types'

interface MobileNavigationProps {
  navItems: ShellNavItem[]
  badges: Partial<Record<NavBadgeKey, number>>
}

function TabBadge({ count }: { count?: number }) {
  if (!count || count <= 0) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export function MobileNavigation({ navItems, badges }: MobileNavigationProps) {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const tabItems = navItems.filter((item) => item.placement.includes('tab')).slice(0, 4)
  const moreItems = navItems.filter((item) => item.placement.includes('more'))

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!moreOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [moreOpen])

  const moreActive = moreItems.some((item) => location.pathname.startsWith(item.to))

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-elevated/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile navigation"
      >
        <ul className="grid grid-cols-5 h-16">
          {tabItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center gap-1 h-full px-1 text-[11px] transition-colors duration-150 ${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`
                }
              >
                <span className="relative">
                  <item.icon size={20} strokeWidth={1.75} aria-hidden />
                  <TabBadge count={item.badgeKey ? badges[item.badgeKey] : undefined} />
                </span>
                <span className="truncate max-w-full">{item.label}</span>
              </NavLink>
            </li>
          ))}

          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={`relative flex flex-col items-center justify-center gap-1 h-full w-full px-1 text-[11px] transition-colors duration-150 cursor-pointer ${
                moreActive ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}
              aria-label="More navigation"
              aria-expanded={moreOpen}
            >
              <MoreHorizontal size={20} strokeWidth={1.75} />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute bottom-0 inset-x-0 rounded-t-[20px] border-t border-border bg-elevated shadow-md max-h-[70vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <h2 className="font-heading text-lg font-semibold text-foreground">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 -mr-2 text-muted-foreground hover:text-foreground rounded-[12px] cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <ul className="p-2 space-y-1">
              {moreItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-muted'
                      }`
                    }
                  >
                    <item.icon size={18} strokeWidth={1.75} aria-hidden />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-[8px] border border-border text-muted-foreground">
                        {item.badge}
                      </span>
                    )}
                    {item.badgeKey && badges[item.badgeKey] ? (
                      <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                        {badges[item.badgeKey]! > 99 ? '99+' : badges[item.badgeKey]}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
