import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAuditLogs } from '../../services/auditLog'
import { fetchRecentActivity } from '../../services/admin'
import { AdminTable } from '../../components/admin/AdminTable'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/shell/PageHeader'
import { formatRelativeDate } from '../../utils/format'

export function AdminAuditPage() {
  const { data: auditLogs, loading: auditLoading, error, refetch } = useAsyncData(() => fetchAuditLogs())
  const { data: activityFeed } = useAsyncData(() => fetchRecentActivity())

  const hasAuditTable = (auditLogs ?? []).length > 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit log"
        description="Immutable record of admin actions with before/after values."
      />

      {auditLoading ? (
        <TeacherTableSkeleton rows={6} />
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-destructive border border-destructive/20 bg-destructive/10 px-4 py-3 rounded-[12px]">
            Unable to load audit log. Please refresh the page.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm font-medium text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Admin actions</h2>
            <AdminTable headers={['Action', 'Entity', 'Actor', 'Changes', 'When']}>
              {!hasAuditTable ? (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm text-muted-foreground">
                    No admin audit entries yet. Actions like teacher approval are recorded here after
                    migration 014 is applied.
                  </td>
                </tr>
              ) : (
                auditLogs!.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3 text-sm font-medium">{entry.action}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {entry.entityType}
                      {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}…` : ''}
                    </td>
                    <td className="px-4 py-3 text-sm">{entry.actorEmail ?? '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground max-w-xs truncate">
                      {entry.oldValue || entry.newValue
                        ? `${JSON.stringify(entry.oldValue ?? {})} → ${JSON.stringify(entry.newValue ?? {})}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground shrink-0">
                      {formatRelativeDate(entry.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </AdminTable>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Platform activity feed</h2>
            <p className="text-sm text-muted-foreground">Recent registrations and bookings.</p>
            <AdminTable headers={['Activity', 'When']}>
              {(activityFeed ?? []).length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm text-muted-foreground">
                    No recent activity.
                  </td>
                </tr>
              ) : (
                activityFeed!.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-sm">{a.text}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground shrink-0">{a.time}</td>
                  </tr>
                ))
              )}
            </AdminTable>
          </section>
        </>
      )}
    </div>
  )
}
