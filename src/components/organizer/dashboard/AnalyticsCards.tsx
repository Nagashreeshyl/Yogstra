import { lazy, Suspense } from 'react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import type { OrganizerAnalytics } from '../../../services/organizerDashboard'
import { LoadingSkeleton } from '../../shell/LoadingSkeleton'

const AnalyticsCharts = lazy(() =>
  import('./AnalyticsCharts').then((m) => ({ default: m.AnalyticsCharts })),
)

interface AnalyticsCardsProps {
  analytics: OrganizerAnalytics
}

export function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  return (
    <DashboardCard
      title="Analytics"
      description="Registrations, revenue, and operational metrics."
      className="lg:col-span-2"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-4">
        <Metric label="Revenue" value={`₹${analytics.revenue.toLocaleString('en-IN')}`} />
        <Metric label="Attendance" value={`${analytics.attendanceRate}%`} />
        <Metric label="Academies" value={String(analytics.academyCount)} />
        <Metric label="Judge completion" value={`${analytics.judgeCompletionRate}%`} />
        <Metric
          label="Top category"
          value={
            analytics.registrationsByCategory.sort((a, b) => b.count - a.count)[0]?.category ?? '—'
          }
        />
      </div>
      <Suspense fallback={<LoadingSkeleton className="h-32 w-full rounded-[12px]" />}>
        <AnalyticsCharts data={analytics} />
      </Suspense>
    </DashboardCard>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-muted/20 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground truncate">{value}</p>
    </div>
  )
}
