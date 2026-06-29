import { useEffect, useRef, useState } from 'react'
import { Clock, X } from 'lucide-react'
import { CLASS_SESSION_DURATION_MINUTES } from '../../services/liveClasses'

interface ClassHourTimeUpNoticeProps {
  role: 'teacher' | 'student'
  sessionScheduledAt: string | null
  sessionStartedAt?: string | null
  otherParticipantName?: string
}

function resolveClassStartAt(
  sessionScheduledAt: string | null,
  sessionStartedAt?: string | null,
): number | null {
  const candidate = sessionScheduledAt ?? sessionStartedAt
  if (!candidate) return null
  const ms = new Date(candidate).getTime()
  return Number.isNaN(ms) ? null : ms
}

export function ClassHourTimeUpNotice({
  role,
  sessionScheduledAt,
  sessionStartedAt,
  otherParticipantName,
}: ClassHourTimeUpNoticeProps) {
  const [visible, setVisible] = useState(false)
  const shownRef = useRef(false)

  useEffect(() => {
    shownRef.current = false
    setVisible(false)
  }, [sessionScheduledAt, sessionStartedAt])

  useEffect(() => {
    const startMs = resolveClassStartAt(sessionScheduledAt, sessionStartedAt)
    if (!startMs || shownRef.current) return

    const endMs = startMs + CLASS_SESSION_DURATION_MINUTES * 60_000
    const now = Date.now()

    const showNotice = () => {
      if (shownRef.current) return
      shownRef.current = true
      setVisible(true)
    }

    if (now >= endMs) {
      showNotice()
      return
    }

    const delay = endMs - now + 32
    const timer = window.setTimeout(showNotice, delay)
    return () => window.clearTimeout(timer)
  }, [sessionScheduledAt, sessionStartedAt])

  if (!visible) return null

  const label = otherParticipantName ?? (role === 'teacher' ? 'your student' : 'your teacher')

  return (
    <div className="absolute inset-x-0 top-4 z-[110] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-sm rounded-sm border border-amber-400/45 bg-sidebar/95 px-4 py-3 shadow-lg flex items-start gap-3">
        <Clock size={18} className="text-amber-300 shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-primary-foreground text-sm font-medium">Time&apos;s up</p>
          <p className="text-primary-foreground/55 text-xs mt-1">
            {role === 'teacher'
              ? `Your 1-hour slot with ${label} has ended. This is only a reminder — the call stays open until you end the class.`
              : `Your scheduled hour with ${label} has ended. Please stay on the call until your teacher ends the class.`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-primary-foreground/45 hover:text-primary-foreground shrink-0 cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
