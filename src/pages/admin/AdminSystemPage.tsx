import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchRecentErrors, fetchRecentActivityLogs } from '../../services/activityLog'
import { fetchAnalyticsSummary, analyticsToCsv } from '../../services/platformAnalytics'
import { fetchSystemHealth } from '../../services/systemHealth'
import { PageHeader } from '../../components/shell/PageHeader'
import { AdminTable } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { formatRelativeDate } from '../../utils/format'

function StatusBadge({ status }: { status: string }) {
  const colors =
    status === 'ok'
      ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
      : status === 'error'
        ? 'bg-destructive/10 text-destructive border-destructive/20'
        : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${colors}`}>
      {status}
    </span>
  )
}

export function AdminSystemPage() {
  const { data: health, loading: healthLoading, refetch: refetchHealth } = useAsyncData(() => fetchSystemHealth())
  const { data: errors } = useAsyncData(() => fetchRecentErrors(15))
  const { data: activity } = useAsyncData(() => fetchRecentActivityLogs(20))
  const { data: analytics } = useAsyncData(() => fetchAnalyticsSummary(30))

  const exportCsv = () => {
    if (!analytics) return
    const blob = new Blob([analyticsToCsv(analytics)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `yogstra-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="System health"
        description="Platform status, errors, and usage metrics for beta operations."
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={() => void refetchHealth(true)}>
            Refresh
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {healthLoading ? (
          <p className="text-sm text-muted-foreground">Checking services…</p>
        ) : (
          health?.checks.map((check) => (
            <div
              key={check.name}
              className="rounded-[16px] border border-border bg-elevated p-4 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-foreground">{check.name}</h3>
                <StatusBadge status={check.status} />
              </div>
              {check.latencyMs != null && (
                <p className="text-xs text-muted-foreground">{check.latencyMs}ms</p>
              )}
              {check.message && (
                <p className="text-xs text-muted-foreground truncate" title={check.message}>
                  {check.message}
                </p>
              )}
            </div>
          ))
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[16px] border border-border bg-elevated p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Deployment</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Server time</dt>
            <dd>{health ? new Date(health.serverTime).toLocaleString('en-IN') : '—'}</dd>
            <dt className="text-muted-foreground">Version</dt>
            <dd className="font-mono text-xs">{health?.version ?? '—'}</dd>
            <dt className="text-muted-foreground">Unread notifications</dt>
            <dd>{health?.pendingNotifications ?? 0}</dd>
            <dt className="text-muted-foreground">Errors (24h)</dt>
            <dd>{health?.recentErrorCount ?? 0}</dd>
          </dl>
        </div>

        {analytics && (
          <div className="rounded-[16px] border border-border bg-elevated p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Analytics (30d)</h3>
              <Button type="button" variant="ghost" size="sm" onClick={exportCsv}>
                Export CSV
              </Button>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-muted-foreground">DAU</dt>
              <dd>{analytics.dailyActiveUsers}</dd>
              <dt className="text-muted-foreground">WAU</dt>
              <dd>{analytics.weeklyActiveUsers}</dd>
              <dt className="text-muted-foreground">MAU</dt>
              <dd>{analytics.monthlyActiveUsers}</dd>
              <dt className="text-muted-foreground">Enrollments</dt>
              <dd>{analytics.enrollments}</dd>
              <dt className="text-muted-foreground">Registrations</dt>
              <dd>{analytics.newRegistrations}</dd>
            </dl>
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Recent errors</h3>
        <AdminTable headers={['Action', 'Error', 'When']}>
          {(errors ?? []).length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-sm text-muted-foreground">
                No errors logged in the last period.
              </td>
            </tr>
          ) : (
            errors!.map((e) => (
              <tr key={e.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-sm">{e.action}</td>
                <td className="px-4 py-3 text-sm text-destructive max-w-xs truncate">
                  {e.errorMessage ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground shrink-0">
                  {formatRelativeDate(e.createdAt)}
                </td>
              </tr>
            ))
          )}
        </AdminTable>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
        <AdminTable headers={['Action', 'Status', 'Role', 'When']}>
          {(activity ?? []).length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-3 text-sm text-muted-foreground">
                No activity logged yet. Events appear after user actions.
              </td>
            </tr>
          ) : (
            activity!.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-sm">{a.action}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={a.status === 'success' ? 'ok' : a.status} />
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{a.role ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground shrink-0">
                  {formatRelativeDate(a.createdAt)}
                </td>
              </tr>
            ))
          )}
        </AdminTable>
      </section>
    </div>
  )
}
