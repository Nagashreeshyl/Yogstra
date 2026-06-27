import { useLiveSync } from './useLiveSync'
import { useAppIntervalRefresh } from './useIntervalRefresh'
import type { LiveSyncScope } from '../services/liveSync'

/**
 * Supabase realtime (instant) + 15s background refresh (silent, no loading spinner).
 */
export function useLiveDataRefresh(
  refetch: (silent?: boolean) => void | Promise<void>,
  scopes: LiveSyncScope[],
  enabled = true,
) {
  useLiveSync(refetch, scopes, enabled)
  useAppIntervalRefresh(() => {
    void refetch(true)
  }, enabled)
}
