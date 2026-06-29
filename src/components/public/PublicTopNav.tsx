import { Link, NavLink } from 'react-router-dom'
import { UserMenu } from '../shell/UserMenu'
import { primaryPublicNav } from './publicNavLinks'
import { Button } from '../ui/Button'

type PublicTopNavProps = {
  onOpenMobile: () => void
  mobileOpen: boolean
}

export function PublicTopNav({ onOpenMobile, mobileOpen }: PublicTopNavProps) {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap ${
      isActive ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          className="lg:hidden p-2 -ml-2 rounded-[12px] text-foreground hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={onOpenMobile}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {mobileOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <Link to="/" className="font-heading text-xl font-semibold text-foreground shrink-0">
          Yogstra
        </Link>

        <nav className="hidden lg:flex items-center gap-5 flex-1 ml-4 overflow-x-auto" aria-label="Primary">
          {primaryPublicNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 ml-auto shrink-0">
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
