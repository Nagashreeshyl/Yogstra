import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Moon, Sun, UserPlus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'
import { getDashboardPath, formatRoleLabel } from '../../utils/authRouting'
import { Avatar } from '../ui/Avatar'

interface UserMenuProps {
  showAuthActions?: boolean
}

export function UserMenu({ showAuthActions = false }: UserMenuProps) {
  const { isLoggedIn, user, logout, authLoading } = useApp()
  const { resolved, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  if (authLoading) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" aria-hidden />
  }

  if (!isLoggedIn || !user) {
    if (!showAuthActions) return null
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogIn size={16} />
          <span className="hidden sm:inline">Login</span>
        </Link>
        <Link
          to="/auth/get-started"
          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-medium rounded-[12px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Sign up</span>
        </Link>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 h-9 pl-1 pr-2 rounded-[12px] hover:bg-muted transition-colors duration-150 cursor-pointer max-w-[200px]"
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar src={user.avatar} name={user.name} size={28} />
        <span className="hidden md:inline text-sm font-medium truncate text-foreground">
          {user.name}
        </span>
        <ChevronDown size={14} className="hidden md:block text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-[16px] border border-border bg-elevated shadow-md py-2 z-[85] max-lg:fixed max-lg:right-4 max-lg:left-auto max-lg:top-[calc(3.5rem+env(safe-area-inset-top))] max-lg:bottom-auto max-lg:mt-0"
        >
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium truncate text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{formatRoleLabel(user)}</p>
          </div>

          {user.role !== 'student' && (
            <Link
              to={getDashboardPath(user)}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard size={16} />
              Go to dashboard
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              toggle()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {resolved === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {resolved === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void logout()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
