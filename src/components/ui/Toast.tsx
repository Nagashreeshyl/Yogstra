import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const styles =
    type === 'error'
      ? 'bg-red-50 border-red-200 text-red-800'
      : type === 'info'
        ? 'bg-amber-50 border-amber-200 text-amber-900'
        : 'bg-elevated border-border text-foreground'

  return (
    <div
      className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-sm border shadow-sm max-w-sm ${styles}`}
    >
      <span className="text-sm flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="text-muted-foreground hover:text-foreground cursor-pointer"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
