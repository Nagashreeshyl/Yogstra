import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchPayouts, markPayoutPaid } from '../../services/admin'
import { AdminTable } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

export function AdminPayoutsPage() {
  const { data: payouts, loading, refetch } = useAsyncData(() => fetchPayouts())

  const handleMarkPaid = async (id: string) => {
    await markPayoutPaid(id)
    await refetch()
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Payouts</h1>

      {loading ? (
        <p className="text-charcoal/50">Loading payouts...</p>
      ) : (
        <AdminTable headers={['Teacher', 'Amount Due', 'Period', 'Status', 'Actions']}>
          {(payouts ?? []).length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-3 text-sm text-charcoal/50">No payouts recorded.</td>
            </tr>
          ) : (
            payouts!.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{p.teacherName}</td>
                <td className="px-4 py-3">₹{p.amount.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">{p.period}</td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === 'Paid' ? 'verified' : 'teal'}>{p.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {p.status === 'Pending' && (
                    <Button size="sm" onClick={() => handleMarkPaid(p.id)}>Mark as Paid</Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </AdminTable>
      )}
    </div>
  )
}
