import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Shield } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { formatRoleLabel } from '../../utils/authRouting'

/** Role switcher architecture — multi-role switching ships with Auth module. */
export function RoleSwitcher() {
  const { user, isLoggedIn } = useApp()
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

  if (!isLoggedIn || !user) return null

  const futureRoles = [
    { id: 'student', label: 'Student', active: user.role === 'student' },
    { id: 'teacher', label: 'Teacher', active: user.role === 'teacher' },
    { id: 'academy', label: 'Academy', active: false },
    { id: 'organizer', label: 'Organizer', active: false },
    { id: 'judge', label: 'Judge', active: false },
    { id: 'admin', label: 'Admin', active: user.role === 'admin' },
  ]

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[12px] border border-border bg-background text-sm text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
        aria-label="Switch role"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Shield size={14} className="text-primary" />
        <span>{formatRoleLabel(user)}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Available roles"
          className="absolute right-0 top-full mt-2 w-52 rounded-[16px] border border-border bg-elevated shadow-md py-2 z-50"
        >
          <p className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Roles
          </p>
          {futureRoles.map((role) => (
            <button
              key={role.id}
              type="button"
              role="option"
              aria-selected={role.active}
              disabled={!role.active}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                role.active
                  ? 'text-foreground bg-primary/10 cursor-default'
                  : 'text-muted-foreground cursor-not-allowed opacity-60'
              }`}
            >
              {role.label}
              {role.active && (
                <span className="text-[10px] uppercase tracking-wide text-primary font-medium">Active</span>
              )}
            </button>
          ))}
          <p className="px-3 pt-2 pb-1 text-[11px] text-muted-foreground border-t border-border mt-1">
            Multi-role switching arrives with the auth module.
          </p>
        </div>
      )}
    </div>
  )
}
