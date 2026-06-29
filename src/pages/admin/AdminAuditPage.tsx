import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchRecentActivity } from '../../services/admin'
import { AdminTable } from '../../components/admin/AdminTable'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/shell/PageHeader'

export function AdminAuditPage() {
  const { data: activities, loading, error, refetch } = useAsyncData(() => fetchRecentActivity())

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Administrative action history." />

      <p className="text-muted-foreground mb-8">Recent platform activity from registrations and bookings.</p>

      {loading ? (
        <TeacherTableSkeleton rows={6} />
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
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
        <AdminTable headers={['Activity', 'When']}>
          {(activities ?? []).length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-3 text-sm text-muted-foreground">
                No recent activity recorded.
              </td>
            </tr>
          ) : (
            activities!.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{a.text}</td>
                <td className="px-4 py-3 text-muted-foreground shrink-0">{a.time}</td>
              </tr>
            ))
          )}
        </AdminTable>
      )}
    </div>
  )
}
