import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { UserMenu } from '../shell/UserMenu'
import { primaryPublicNav, resourcePublicNav } from './publicNavLinks'
import { Button } from '../ui/Button'

type PublicTopNavProps = {
  onOpenMobile: () => void
  mobileOpen: boolean
}

export function PublicTopNav({ onOpenMobile, mobileOpen }: PublicTopNavProps) {
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const resourcesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!resourcesOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [resourcesOpen])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="lg:hidden p-2 -ml-2 rounded-[12px] text-foreground hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={onOpenMobile}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="font-heading text-xl font-semibold text-foreground shrink-0">
          Yogstra
        </Link>

        <nav className="hidden lg:flex items-center gap-6 flex-1 ml-6" aria-label="Primary">
          {primaryPublicNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}

          <div ref={resourcesRef} className="relative">
            <button
              type="button"
              onClick={() => setResourcesOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer"
              aria-expanded={resourcesOpen}
            >
              Resources
              <ChevronDown size={14} />
            </button>
            {resourcesOpen && (
              <div className="absolute left-0 top-full mt-2 w-44 rounded-[16px] border border-border bg-elevated py-2 shadow-lg">
                {resourcePublicNav.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setResourcesOpen(false)}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <Link to="/auth/login" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/auth/get-started">
            <Button size="sm">Get Started</Button>
          </Link>
          <UserMenu showAuthActions={false} />
        </div>
      </div>
    </header>
  )
}
