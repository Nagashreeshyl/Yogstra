import { useCallback, useEffect, useState } from 'react'
import { formatUserFacingError } from '../utils/format'

interface UseAsyncDataOptions {
  /** When false, skip fetching until enabled (keeps prior data). */
  enabled?: boolean
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options?: UseAsyncDataOptions,
) {
  const enabled = options?.enabled ?? true
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async (silent = false) => {
    if (!enabled) return
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const result = await fetcher()
      setData(result)
      if (silent) setError(null)
    } catch (err) {
      setError(formatUserFacingError(err))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [enabled, ...deps]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    void refetch(false)
  }, [refetch, enabled])

  return { data, loading, error, refetch, setData }
}
