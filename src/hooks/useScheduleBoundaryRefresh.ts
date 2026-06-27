import { useEffect, useRef } from 'react'
import { CLASS_SESSION_DURATION_MINUTES, CLASS_START_ALERT_WINDOW_MS } from '../services/liveClasses'

function collectBoundaries(scheduleTimes: string[], now = Date.now()) {
  const boundaries = new Set<number>()

  for (const iso of scheduleTimes) {
    const start = new Date(iso).getTime()
    if (Number.isNaN(start)) continue

    const end = start + CLASS_SESSION_DURATION_MINUTES * 60_000
    const alertEnd = start + CLASS_START_ALERT_WINDOW_MS

    for (const t of [start, alertEnd, end]) {
      if (t > now) boundaries.add(t)
    }
  }

  return boundaries
}

/**
 * Refetch once when the next class schedule boundary is reached (start, alert end, hour end).
 * Uses a single setTimeout — no polling interval.
 */
export function useScheduleBoundaryRefresh(
  scheduleTimes: (string | null | undefined)[],
  onBoundary: () => void,
  enabled = true,
) {
  const saved = useRef(onBoundary)
  saved.current = onBoundary

  const timesKey = scheduleTimes.filter(Boolean).join('|')

  useEffect(() => {
    if (!enabled || !timesKey) return

    const times = timesKey.split('|')
    const boundaries = collectBoundaries(times)
    const next = boundaries.size > 0 ? Math.min(...boundaries) : Infinity

    if (!Number.isFinite(next)) return

    const delay = Math.max(0, next - Date.now()) + 32
    const id = window.setTimeout(() => saved.current(), delay)
    return () => window.clearTimeout(id)
  }, [enabled, timesKey])
}
