import { useCallback, useEffect, useState } from 'react'
import { studentHasPaidCoaching } from '../services/liveClasses'
import { useLiveDataRefresh } from './useLiveDataRefresh'

export function useStudentCoachingAccess(studentId: string | undefined) {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(Boolean(studentId))

  const refresh = useCallback(async () => {
    if (!studentId) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const value = await studentHasPaidCoaching(studentId)
      setHasAccess(value)
    } catch {
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useLiveDataRefresh(
    () => {
      void refresh()
    },
    ['bookings', 'schedules'],
    Boolean(studentId),
  )

  return { hasAccess, loading, refresh }
}
