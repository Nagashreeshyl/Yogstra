import type { OrganizerAnalytics } from '../../../services/organizerDashboard'

interface AnalyticsChartsProps {
  data: OrganizerAnalytics
}

export function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const max = Math.max(1, ...data.registrationsByCategory.map((item) => item.count))

  if (data.registrationsByCategory.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Category breakdown appears once registrations arrive.
      </p>
    )
  }

  return (
    <div className="space-y-3" role="img" aria-label="Registrations by category chart">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Registrations by category
      </p>
      {data.registrationsByCategory.map((item) => (
        <div key={item.category}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-foreground truncate pr-2">{item.category}</span>
            <span className="text-muted-foreground shrink-0">{item.count}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
