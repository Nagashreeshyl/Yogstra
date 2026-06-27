import { createContext, useCallback, useContext, useEffect, useRef } from 'react'
import { APP_REFRESH_INTERVAL_MS } from '../constants/refresh'

type RefreshCallback = () => void

const AppRefreshContext = createContext<((cb: RefreshCallback) => () => void) | null>(null)

/** One shared 15s timer for the whole app; hooks register silent refetch callbacks. */
export function AppRefreshProvider({ children }: { children: React.ReactNode }) {
  const listeners = useRef(new Set<RefreshCallback>())

  useEffect(() => {
    const id = setInterval(() => {
      listeners.current.forEach((cb) => cb())
    }, APP_REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const register = useCallback((cb: RefreshCallback) => {
    listeners.current.add(cb)
    return () => {
      listeners.current.delete(cb)
    }
  }, [])

  return (
    <AppRefreshContext.Provider value={register}>{children}</AppRefreshContext.Provider>
  )
}

export function useRegisterAppRefresh() {
  return useContext(AppRefreshContext)
}
