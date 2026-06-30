import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchBetaFeedback,
  updateFeedbackStatus,
  type BetaFeedback,
} from '../../services/betaFeedback'
import { PageHeader } from '../../components/shell/PageHeader'
import { AdminTable } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { formatRelativeDate } from '../../utils/format'

export function AdminFeedbackPage() {
  const { data: items, loading, refetch } = useAsyncData(() => fetchBetaFeedback())
  const [filter, setFilter] = useState('')

  const filtered = (items ?? []).filter(
    (f) => !filter || f.status === filter || f.category === filter,
  )

  const handleStatus = async (id: string, status: string) => {
    await updateFeedbackStatus(id, status)
    await refetch(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Beta feedback" description="User-submitted bugs, suggestions, and requests." />

      <AdminTable
        headers={['Category', 'Message', 'User', 'Page', 'Status', 'When', 'Actions']}
        filterOptions={[
          { label: 'Open', value: 'open' },
          { label: 'Reviewed', value: 'reviewed' },
          { label: 'Resolved', value: 'resolved' },
          { label: 'Bug', value: 'bug' },
          { label: 'Suggestion', value: 'suggestion' },
        ]}
        onFilter={setFilter}
      >
        {loading ? (
          <tr>
            <td colSpan={7} className="px-4 py-3 text-sm text-muted-foreground">
              Loading…
            </td>
          </tr>
        ) : filtered.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-4 py-3 text-sm text-muted-foreground">
              No feedback submitted yet.
            </td>
          </tr>
        ) : (
          filtered.map((f: BetaFeedback) => (
            <tr key={f.id} className="border-b border-border last:border-0 align-top">
              <td className="px-4 py-3">
                <Badge variant="default">{f.category}</Badge>
              </td>
              <td className="px-4 py-3 text-sm max-w-md">{f.message}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground">{f.role ?? '—'}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{f.pageUrl ?? '—'}</td>
              <td className="px-4 py-3 text-sm capitalize">{f.status}</td>
              <td className="px-4 py-3 text-sm text-muted-foreground shrink-0">
                {formatRelativeDate(f.createdAt)}
              </td>
              <td className="px-4 py-3 space-x-2">
                {f.status === 'open' && (
                  <>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => void handleStatus(f.id, 'reviewed')}
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => void handleStatus(f.id, 'resolved')}
                    >
                      Resolve
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))
        )}
      </AdminTable>
    </div>
  )
}
