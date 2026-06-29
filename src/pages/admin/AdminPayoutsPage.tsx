import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchPayouts, markPayoutPaid } from '../../services/admin'
import { AdminTable } from '../../components/admin/AdminTable'
import { UpiPayoutModal } from '../../components/admin/UpiPayoutModal'
import { EmptyState } from '../../components/shell/EmptyState'
import { PageHeader } from '../../components/shell/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { formatRelativeDate } from '../../utils/format'
import type { Payout } from '../../types'

export function AdminPayoutsPage() {
  const { data: payouts, loading, refetch } = useAsyncData(() => fetchPayouts())
  const [payTarget, setPayTarget] = useState<Payout | null>(null)

  useLiveDataRefresh(() => void refetch(true), ['payouts'])

  const handleMarkPaid = async (id: string) => {
    await markPayoutPaid(id)
    await refetch()
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payouts" description="Teacher payout ledger and transfers." />

      {loading ? (
        <TeacherTableSkeleton rows={4} />
      ) : (
        <div className="overflow-x-auto">
          <AdminTable
            headers={[
              'Teacher',
              'UPI ID',
              'Student',
              'Gross',
              'Commission',
              'Teacher Share',
              'Status',
              'Date',
              'Actions',
            ]}
          >
            {(payouts ?? []).length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState
                    title="No payouts yet"
                    description="They appear when a student completes payment."
                  />
                </td>
              </tr>
            ) : (
              payouts!.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{p.teacherName}</td>
                  <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                    {p.teacherUpiId ?? '—'}
                  </td>
                  <td className="px-4 py-3">{p.studentName ?? '—'}</td>
                  <td className="px-4 py-3">
                    ₹{(p.grossAmount ?? p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    ₹{(p.commissionAmount ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ₹{(p.teacherAmount ?? p.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === 'Paid' ? 'verified' : 'primary'}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.createdAt ? formatRelativeDate(p.createdAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'Pending' && (
                      <div className="flex flex-wrap gap-2">
                        {p.teacherUpiId && (
                          <Button size="sm" onClick={() => setPayTarget(p)}>
                            Pay teacher
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleMarkPaid(p.id)}
                        >
                          Mark as Paid
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </AdminTable>
        </div>
      )}

      {payTarget && (
        <UpiPayoutModal
          payout={payTarget}
          isOpen={Boolean(payTarget)}
          onClose={() => setPayTarget(null)}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </div>
  )
}
