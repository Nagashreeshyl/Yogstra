import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { MoreHorizontal, X } from 'lucide-react'
import { MOBILE_TAB_BAR_BOTTOM } from '../../constants/mobileNav'
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
  const columnCount = tabItems.length + 1

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
      {/* In-flow pill tab bar — reserves layout space so page content cannot scroll underneath */}
      <nav
        className="mobile-tab-bar lg:hidden shrink-0 relative z-[70] pointer-events-none px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        aria-label="Mobile navigation"
      >
        <div className="pointer-events-auto mx-auto max-w-lg rounded-[28px] border border-border/80 bg-elevated/95 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.28)]">
          <ul
            className="grid h-[3.75rem] px-1"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {tabItems.map((item) => (
              <li key={`${item.to}-${item.label}`}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center gap-0.5 h-full px-0.5 text-[10px] transition-colors duration-150 rounded-[20px] ${
                      isActive ? 'text-accent font-semibold' : 'text-muted-foreground'
                    }`
                  }
                >
                  <span className="relative">
                    <item.icon size={20} strokeWidth={1.75} aria-hidden />
                    <TabBadge count={item.badgeKey ? badges[item.badgeKey] : undefined} />
                  </span>
                  <span className="truncate max-w-full leading-tight">{item.label}</span>
                </NavLink>
              </li>
            ))}

            <li>
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className={`relative flex flex-col items-center justify-center gap-0.5 h-full w-full px-0.5 text-[10px] transition-colors duration-150 cursor-pointer rounded-[20px] ${
                  moreActive || moreOpen ? 'text-accent font-semibold' : 'text-muted-foreground'
                }`}
                aria-label="More navigation"
                aria-expanded={moreOpen}
              >
                <MoreHorizontal size={20} strokeWidth={1.75} />
                <span className="leading-tight">More</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/50 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute inset-x-3 max-w-lg mx-auto rounded-[24px] border border-border bg-elevated shadow-2xl max-h-[min(55vh,420px)] overflow-y-auto"
            style={{ bottom: MOBILE_TAB_BAR_BOTTOM }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-elevated rounded-t-[24px] z-10">
              <h2 className="font-heading text-base font-semibold text-foreground">More</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 -mr-1 text-muted-foreground hover:text-foreground rounded-[12px] cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <ul className="p-2 space-y-0.5 pb-2">
              {moreItems.map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-[14px] text-sm transition-colors ${
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
