import { useCallback, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchTeacherSchedulesForMonth } from '../../services/classOrders'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { TeacherScheduleCalendar } from '../../components/schedule/TeacherScheduleCalendar'

export function TeacherSchedulePage() {
  const { user } = useApp()
  const today = new Date()
  const [monthKey, setMonthKey] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })

  const { data: schedules, loading, refetch } = useAsyncData(
    () =>
      user
        ? fetchTeacherSchedulesForMonth(user.id, monthKey.year, monthKey.month)
        : Promise.resolve([]),
    [user?.id, monthKey.year, monthKey.month],
  )

  useLiveDataRefresh(refetch, ['schedules'], Boolean(user?.id))

  const handleMonthChange = useCallback((year: number, month: number) => {
    setMonthKey((prev) =>
      prev.year === year && prev.month === month ? prev : { year, month },
    )
  }, [])

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Schedule"
          description="Your calendar updates automatically when students book and pay for classes."
        />

        <TeacherScheduleCalendar
          schedules={schedules ?? []}
          loading={loading}
          onMonthChange={handleMonthChange}
        />
      </div>
    </PageContainer>
  )
}
