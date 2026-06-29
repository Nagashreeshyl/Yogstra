import { useEffect, useRef } from 'react'
import { Video, X } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { startIncomingCallRingFor } from '../../utils/notificationSounds'

const RING_DURATION_MS = 30_000

interface TeacherClassTimeOverlayProps {
  studentName: string
  studentPhoto?: string
  sessionTime: string
  starting?: boolean
  onStart: () => void
  onDismiss: () => void
}

function formatSessionTimeLabel(iso: string) {
  const date = new Date(iso)
  return `${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
}

export function TeacherClassTimeOverlay({
  studentName,
  studentPhoto,
  sessionTime,
  starting = false,
  onStart,
  onDismiss,
}: TeacherClassTimeOverlayProps) {
  const stopRingRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    stopRingRef.current = startIncomingCallRingFor(RING_DURATION_MS)
    if (navigator.vibrate) {
      navigator.vibrate([300, 150, 300])
    }
    return () => {
      stopRingRef.current?.()
      stopRingRef.current = null
    }
  }, [studentName, sessionTime])

  const stopRing = () => {
    stopRingRef.current?.()
    stopRingRef.current = null
  }

  return (
    <div className="fixed top-4 right-4 z-[95] w-full max-w-sm px-4 sm:px-0 pointer-events-none">
      <div className="pointer-events-auto rounded-sm border border-primary/50 bg-sidebar shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <Avatar src={studentPhoto} name={studentName} size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-primary-foreground/55 text-xs mb-0.5">Class time</p>
            <p className="text-primary-foreground text-sm font-semibold leading-snug">
              It&apos;s time for {studentName}&apos;s class
            </p>
            <p className="text-primary-foreground/45 text-xs mt-1">{formatSessionTimeLabel(sessionTime)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              stopRing()
              onDismiss()
            }}
            className="text-primary-foreground/45 hover:text-primary-foreground shrink-0 cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={() => {
              stopRing()
              onDismiss()
            }}
          >
            Later
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5"
            disabled={starting}
            onClick={() => {
              stopRing()
              onStart()
            }}
          >
            <Video size={16} />
            {starting ? 'Starting…' : 'Start class'}
          </Button>
        </div>
      </div>
    </div>
  )
}
