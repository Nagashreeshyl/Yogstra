import { fetchTeacherById } from '../services/teachers'
import { isTeacherProfileComplete } from '../utils/teacherProfileCompletion'
import { useAsyncData } from './useAsyncData'

/** Whether a verified teacher has a 100% complete profile and can accept class purchases. */
export function useTeacherPurchaseEligibility(
  teacherId: string | undefined,
  enabled: boolean,
) {
  const shouldFetch = enabled && Boolean(teacherId)

  const { data: teacher, loading } = useAsyncData(
    () => (teacherId ? fetchTeacherById(teacherId) : Promise.resolve(null)),
    [teacherId],
    { enabled: shouldFetch },
  )

  const canAcceptPurchase = Boolean(
    teacher?.verified && teacher.status !== 'Removed' && isTeacherProfileComplete(teacher),
  )

  return {
    canAcceptPurchase,
    loading: shouldFetch && loading,
  }
}
