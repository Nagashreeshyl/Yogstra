import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { isAppShellRoute } from '../../utils/appShellRoutes'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  showClose?: boolean
  title?: string
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = '',
  showClose = true,
  title,
}: ModalProps) {
  const aboveMobileTabBar =
    isOpen && typeof window !== 'undefined' && isAppShellRoute(window.location.pathname)

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-[90] flex p-4 max-lg:items-end lg:items-center lg:justify-center ${
        aboveMobileTabBar
          ? 'max-lg:pb-[calc(1rem+3.75rem+1.25rem+max(0.75rem,env(safe-area-inset-bottom)))]'
          : 'max-lg:pb-[max(1rem,env(safe-area-inset-bottom))]'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative max-h-[min(90vh,100%)] w-full max-w-lg overflow-y-auto rounded-[16px] border border-border bg-elevated p-4 shadow-md sm:p-6 lg:p-8 max-lg:rounded-b-[24px] ${className}`}
      >
        {showClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-[8px] p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
        {title && (
          <h2 id="modal-title" className="font-heading text-xl font-semibold text-foreground mb-4 pr-8">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  )
}
