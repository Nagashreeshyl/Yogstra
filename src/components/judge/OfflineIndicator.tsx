import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react'
import type { SyncStatus } from '../../types/judgePortal'

interface OfflineIndicatorProps {
  status: SyncStatus
  pendingCount: number
}

const labels: Record<SyncStatus, string> = {
  synced: 'All scores synced',
  pending: 'Offline — scores saved locally',
  syncing: 'Syncing scores…',
  error: 'Some scores failed to sync',
}

export function OfflineIndicator({ status, pendingCount }: OfflineIndicatorProps) {
  const Icon =
    status === 'synced' ? Wifi : status === 'syncing' ? RefreshCw : status === 'error' ? AlertCircle : WifiOff

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        status === 'synced'
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
          : status === 'error'
            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
            : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
      }`}
      role="status"
      aria-live="polite"
    >
      <Icon size={14} className={status === 'syncing' ? 'animate-spin' : ''} aria-hidden />
      <span>{labels[status]}</span>
      {pendingCount > 0 && <span>({pendingCount} pending)</span>}
    </div>
  )
}
