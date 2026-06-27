import { useState, useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAppIntervalRefresh } from '../../hooks/useIntervalRefresh'
import { fetchAllTeachersAdmin } from '../../services/teachers'
import { fetchSchedulesByTeacher } from '../../services/schedules'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { ScheduleCalendarSkeleton } from '../../components/ui/Skeleton'

export function AdminSchedulesPage() {
  const { data: teachers, refetch: refetchTeachers } = useAsyncData(() => fetchAllTeachersAdmin())
  const [selectedTeacher, setSelectedTeacher] = useState('')

  const teacherId = selectedTeacher || teachers?.[0]?.id || ''
  const teacher = teachers?.find((t) => t.id === teacherId)

  const { data: schedules, loading, refetch: refetchSchedules } = useAsyncData(
    () => (teacherId ? fetchSchedulesByTeacher(teacherId) : Promise.resolve([])),
    [teacherId],
  )

  const refreshAll = useCallback(() => {
    void refetchTeachers(true)
    if (teacherId) void refetchSchedules(true)
  }, [refetchTeachers, refetchSchedules, teacherId])

  useAppIntervalRefresh(refreshAll)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Schedules</h1>

      <div className="max-w-xs mb-8">
        <Select
          label="Select Teacher"
          value={teacherId}
          onChange={(e) => setSelectedTeacher(e.target.value)}
        >
          {(teachers ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </Select>
      </div>

      {teacher && (
        <p className="text-sm text-charcoal/60 mb-4">
          Calendar for <span className="font-medium text-charcoal">{teacher.name}</span>
        </p>
      )}

      {loading ? (
        <ScheduleCalendarSkeleton />
      ) : (schedules ?? []).length === 0 ? (
        <p className="text-charcoal/50">No scheduled classes for this teacher.</p>
      ) : (
        <div className="border border-border rounded-sm divide-y divide-border">
          {schedules!.map((cls) => (
            <div key={cls.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{cls.date} · {cls.time}</p>
                <p className="text-xs text-charcoal/50">{cls.studentNames.join(', ')}</p>
              </div>
              <Badge variant="mode">{cls.type}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
