import { useLiveSync } from './useLiveSync'
import type { LiveSyncScope } from '../services/liveSync'

/** Supabase realtime only — no background polling. */
export function useLiveDataRefresh(
  refetch: (silent?: boolean) => void | Promise<void>,
  scopes: LiveSyncScope[],
  enabled = true,
) {
  useLiveSync(refetch, scopes, enabled)
}
