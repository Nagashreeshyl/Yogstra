import { useEffect } from 'react'
import { subscribeToLiveScopes, type LiveSyncScope } from '../services/liveSync'

/** Silently refetch when Supabase realtime reports matching table changes. */
export function useLiveSync(
  refetch: (silent?: boolean) => void | Promise<void>,
  scopes: LiveSyncScope[],
  enabled = true,
) {
  const scopeKey = scopes.join(',')

  useEffect(() => {
    if (!enabled || scopes.length === 0) return

    const refresh = () => {
      void refetch(true)
    }

    return subscribeToLiveScopes(scopes, refresh)
  }, [refetch, enabled, scopeKey]) // eslint-disable-line react-hooks/exhaustive-deps
}
