import { useEffect, useState } from 'react'
import { getOfflineQueueCount } from '../utils/judgeOfflineQueue'
import { syncOfflineScores } from '../services/judgeScoringService'
import type { SyncStatus } from '../types/judgePortal'

export function useJudgeOfflineSync(onSynced?: () => void) {
  const [status, setStatus] = useState<SyncStatus>(() =>
    getOfflineQueueCount() > 0 ? 'pending' : 'synced',
  )
  const [pendingCount, setPendingCount] = useState(getOfflineQueueCount)

  useEffect(() => {
    async function sync() {
      const count = getOfflineQueueCount()
      setPendingCount(count)
      if (count === 0) {
        setStatus('synced')
        return
      }
      if (!navigator.onLine) {
        setStatus('pending')
        return
      }

      setStatus('syncing')
      const result = await syncOfflineScores()
      setPendingCount(getOfflineQueueCount())
      setStatus(result.failed > 0 ? 'error' : 'synced')
      if (result.synced > 0) onSynced?.()
    }

    void sync()

    const onOnline = () => void sync()
    window.addEventListener('online', onOnline)
    const interval = window.setInterval(() => void sync(), 30_000)

    return () => {
      window.removeEventListener('online', onOnline)
      window.clearInterval(interval)
    }
  }, [onSynced])

  return { status, pendingCount }
}
