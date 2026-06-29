import { useEffect } from 'react'

interface ChatEphemeralToastProps {
  message: string | null
  onDismiss: () => void
  durationMs?: number
}

/** Short-lived notice centered over the chat area (mute, block, copy, etc.) */
export function ChatEphemeralToast({
  message,
  onDismiss,
  durationMs = 1800,
}: ChatEphemeralToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(timer)
  }, [message, onDismiss, durationMs])

  if (!message) return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <div className="px-4 py-2 rounded-full bg-sidebar/90 text-primary-foreground text-xs font-medium shadow-lg max-w-[min(90vw,280px)] text-center leading-snug">
        {message}
      </div>
    </div>
  )
}
