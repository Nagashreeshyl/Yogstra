import { X } from 'lucide-react'
import type { ReactNode } from 'react'

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
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[16px] border border-border bg-elevated p-4 shadow-md sm:p-6 lg:p-8 ${className}`}
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
