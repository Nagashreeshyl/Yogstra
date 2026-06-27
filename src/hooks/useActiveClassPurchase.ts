import { useEffect } from 'react'
import { useAsyncData } from './useAsyncData'
import { useLiveSync } from './useLiveSync'
import { fetchActiveClassPurchase } from '../services/classOrders'

export function useActiveClassPurchase(
  studentId: string | undefined,
  teacherId: string | undefined,
  enabled: boolean,
) {
  const canCheck = enabled && Boolean(studentId && teacherId)

  const { data: activePurchase, refetch } = useAsyncData(
    () =>
      studentId && teacherId
        ? fetchActiveClassPurchase(studentId, teacherId)
        : Promise.resolve(null),
    [studentId, teacherId],
    { enabled: canCheck },
  )

  useLiveSync(refetch, ['schedules'], canCheck)

  useEffect(() => {
    if (!activePurchase) return

    const msUntilExpiry = activePurchase.expiresAt.getTime() - Date.now()
    if (msUntilExpiry <= 0) {
      void refetch(true)
      return
    }

    const timer = window.setTimeout(() => {
      void refetch(true)
    }, msUntilExpiry + 1000)

    return () => clearTimeout(timer)
  }, [activePurchase, refetch])

  return {
    activePurchase,
    hasActivePurchase: Boolean(activePurchase),
    refetchActivePurchase: refetch,
  }
}
