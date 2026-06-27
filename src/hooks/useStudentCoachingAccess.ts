import { useEffect, useState } from 'react'
import { studentHasPaidCoaching } from '../services/liveClasses'

export function useStudentCoachingAccess(studentId: string | undefined) {
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(Boolean(studentId))

  useEffect(() => {
    if (!studentId) {
      setHasAccess(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    void studentHasPaidCoaching(studentId)
      .then((value) => {
        if (!cancelled) setHasAccess(value)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [studentId])

  return { hasAccess, loading }
}
