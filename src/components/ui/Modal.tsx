import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  showClose?: boolean
}

export function Modal({ isOpen, onClose, children, className = '', showClose = true }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/20" onClick={onClose} />
      <div
        className={`relative bg-cream border border-border rounded-sm p-4 sm:p-6 lg:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto ${className}`}
        style={{ boxShadow: '0 4px 24px rgba(28, 28, 28, 0.08)' }}
      >
        {showClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-charcoal/50 hover:text-charcoal transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}
