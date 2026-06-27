import { useEffect, useRef } from 'react'
import { APP_REFRESH_INTERVAL_MS } from '../constants/refresh'
import { useRegisterAppRefresh } from '../context/AppRefreshContext'

export function useIntervalRefresh(
  callback: () => void,
  intervalMs: number = APP_REFRESH_INTERVAL_MS,
  enabled = true,
) {
  const saved = useRef(callback)
  saved.current = callback

  useEffect(() => {
    if (!enabled) return
    const tick = () => saved.current()
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])
}

/** Standard 15s silent background refresh (pairs with useLiveSync). */
export function useAppIntervalRefresh(callback: () => void, enabled = true) {
  const register = useRegisterAppRefresh()
  const saved = useRef(callback)
  saved.current = callback

  useEffect(() => {
    if (!enabled) return
    const tick = () => saved.current()

    if (register) {
      return register(tick)
    }

    const id = setInterval(tick, APP_REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [register, enabled])
}
