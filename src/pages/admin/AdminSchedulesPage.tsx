import { useState, useCallback } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchAllTeachersAdmin } from '../../services/teachers'
import { fetchSchedulesByTeacher } from '../../services/schedules'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { ScheduleCalendarSkeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/shell/PageHeader'

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

  useLiveDataRefresh(refreshAll, ['schedules', 'teachers'])

  return (
    <div className="space-y-6">
      <PageHeader title="Schedules" description="Class schedules across the platform." />

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
        <p className="text-sm text-muted-foreground mb-4">
          Calendar for <span className="font-medium text-foreground">{teacher.name}</span>
        </p>
      )}

      {loading ? (
        <ScheduleCalendarSkeleton />
      ) : (schedules ?? []).length === 0 ? (
        <p className="text-muted-foreground">No scheduled classes for this teacher.</p>
      ) : (
        <div className="rounded-[16px] border border-border divide-y divide-border">
          {schedules!.map((cls) => (
            <div key={cls.id} className="px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{cls.date} · {cls.time}</p>
                <p className="text-xs text-muted-foreground">{cls.studentNames.join(', ')}</p>
              </div>
              <Badge variant="mode">{cls.type}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
