import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchPayouts, markPayoutPaid } from '../../services/admin'
import { AdminTable } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { formatRelativeDate } from '../../utils/format'

export function AdminPayoutsPage() {
  const { data: payouts, loading, refetch } = useAsyncData(() => fetchPayouts())

  useLiveDataRefresh(() => void refetch(true), ['payouts'])

  const handleMarkPaid = async (id: string) => {
    await markPayoutPaid(id)
    await refetch()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-3xl font-medium mb-2">Payouts</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Auto-created when students pay. Route transfers mark payouts as paid automatically.
      </p>

      {loading ? (
        <TeacherTableSkeleton rows={4} />
      ) : (
        <div className="overflow-x-auto">
          <AdminTable
            headers={['Teacher', 'Student', 'Gross', 'Commission', 'Teacher Share', 'Status', 'Date', 'Actions']}
          >
            {(payouts ?? []).length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-sm text-charcoal/50">
                  No payouts yet. They appear when a student completes payment.
                </td>
              </tr>
            ) : (
              payouts!.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{p.teacherName}</td>
                  <td className="px-4 py-3">{p.studentName ?? '—'}</td>
                  <td className="px-4 py-3">
                    ₹{(p.grossAmount ?? p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">
                    ₹{(p.commissionAmount ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ₹{(p.teacherAmount ?? p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === 'Paid' ? 'verified' : 'teal'}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">
                    {p.createdAt ? formatRelativeDate(p.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'Pending' && (
                      <Button size="sm" onClick={() => void handleMarkPaid(p.id)}>
                        Mark as Paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </AdminTable>
        </div>
      )}
    </div>
  )
}
