import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'

interface NotificationDropdownProps {
  count?: number
}

/** Notification center placeholder — wired in a future module. */
export function NotificationDropdown({ count = 0 }: NotificationDropdownProps) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell size={18} strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent" aria-hidden />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 rounded-[16px] border border-border bg-elevated shadow-md p-4 z-50"
        >
          <p className="text-sm font-medium text-foreground">Notifications</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your notification center will appear here. Check back soon.
          </p>
        </div>
      )}
    </div>
  )
}
