import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-sm border shadow-sm max-w-sm ${
        type === 'error'
          ? 'bg-red-50 border-red-200 text-red-800'
          : 'bg-cream border-border text-charcoal'
      }`}
    >
      <span className="text-sm flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-charcoal/50 hover:text-charcoal cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
