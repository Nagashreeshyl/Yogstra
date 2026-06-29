import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { fetchAcademyMonthlyAttendance } from '../../services/attendanceService'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'

export function AcademyAttendancePage() {
  const { academyId } = useAcademyContext()

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      academyId
        ? fetchAcademyMonthlyAttendance(academyId)
        : Promise.reject(new Error('No academy selected')),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  if (loading) return <LoadingSkeleton />
  if (error || !data) {
    return (
      <PageContainer width="wide">
        <ErrorState message={error ?? 'Could not load attendance.'} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Attendance"
        description="Live class attendance across academy-affiliated teachers this month."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DashboardCard title="Attendance rate">
          <p className="text-3xl font-semibold">
            {data.percentage === null ? '—' : `${data.percentage}%`}
          </p>
        </DashboardCard>
        <DashboardCard title="Sessions attended">
          <p className="text-3xl font-semibold">{data.attended}</p>
        </DashboardCard>
        <DashboardCard title="Sessions scheduled">
          <p className="text-3xl font-semibold">{data.scheduled}</p>
        </DashboardCard>
      </div>
    </PageContainer>
  )
}
