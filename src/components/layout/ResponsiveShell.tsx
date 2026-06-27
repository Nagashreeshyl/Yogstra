import { useEffect, useState, type ReactNode } from 'react'
import { Menu, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'

interface ResponsiveShellProps {
  sidebar: ReactNode
  children: ReactNode
  title?: string
  headerClassName?: string
  mainClassName?: string
}

/** Desktop: unchanged sidebar + main. Mobile: top bar + slide-out drawer (lg breakpoint). */
export function ResponsiveShell({
  sidebar,
  children,
  title = 'Yogstra',
  headerClassName = 'bg-charcoal',
  mainClassName = 'bg-surface lg:bg-inherit',
}: ResponsiveShellProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      <header
        className={`lg:hidden flex items-center gap-3 px-4 py-3 border-b border-cream/10 shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] ${headerClassName}`}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-2 -ml-2 text-cream/80 hover:text-cream rounded-sm cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <h1 className="font-heading text-lg font-semibold text-cream truncate">{title}</h1>
      </header>

      <div className="hidden lg:flex shrink-0 h-full min-h-0">{sidebar}</div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[60] flex">
          <button
            type="button"
            className="absolute inset-0 bg-charcoal/50"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-72 max-w-[min(85vw,18rem)] shadow-xl">
            {sidebar}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 p-1.5 text-cream/60 hover:text-cream rounded-sm cursor-pointer"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <main className={`flex-1 overflow-y-auto min-w-0 min-h-0 ${mainClassName}`}>
        {children}
      </main>
    </div>
  )
}
