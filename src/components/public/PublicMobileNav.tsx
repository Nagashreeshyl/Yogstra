import { Link, NavLink } from 'react-router-dom'
import { primaryPublicNav, resourcePublicNav } from './publicNavLinks'
import { Button } from '../ui/Button'

type PublicMobileNavProps = {
  open: boolean
  onClose: () => void
}

export function PublicMobileNav({ open, onClose }: PublicMobileNavProps) {
  if (!open) return null

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-[12px] px-4 py-3 text-base font-medium transition-colors ${
      isActive ? 'bg-sidebar-active text-accent' : 'text-foreground hover:bg-muted'
    }`

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <nav
        className="fixed inset-y-0 left-0 z-[70] w-[min(20rem,88vw)] bg-sidebar border-r border-sidebar-border flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Mobile navigation"
      >
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link to="/" onClick={onClose} className="font-heading text-xl font-semibold text-sidebar-foreground">
            Yogstra
          </Link>
          <p className="mt-1 text-xs text-sidebar-muted">Operating System for Yoga Academies</p>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {primaryPublicNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={onClose}>
              {item.label}
            </NavLink>
          ))}
          <p className="px-4 pt-4 pb-2 text-xs font-medium uppercase tracking-wide text-sidebar-muted">
            Resources
          </p>
          {resourcePublicNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} onClick={onClose}>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link to="/auth/login" onClick={onClose} className="block">
            <Button variant="secondary" className="w-full">
              Login
            </Button>
          </Link>
          <Link to="/auth/get-started" onClick={onClose} className="block">
            <Button className="w-full">Get Started</Button>
          </Link>
        </div>
      </nav>
    </>
  )
}
