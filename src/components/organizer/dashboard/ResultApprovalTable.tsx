import { useState } from 'react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../shell/EmptyState'
import type { OrganizerResultsSummary } from '../../../services/organizerDashboard'
import {
  publishAllApprovedResults,
  updateResultStatus,
} from '../../../services/organizerOperations'

interface ResultApprovalTableProps {
  competitionId: string
  summary: OrganizerResultsSummary
  onUpdated: () => void
}

export function ResultApprovalTable({
  competitionId,
  summary,
  onUpdated,
}: ResultApprovalTableProps) {
  const [busy, setBusy] = useState(false)

  async function handleApprove(resultId: string) {
    setBusy(true)
    try {
      await updateResultStatus(resultId, 'approved')
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  async function handlePublishAll() {
    setBusy(true)
    try {
      await publishAllApprovedResults(competitionId)
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardCard
      title="Results"
      description={`${summary.pendingApprovals} pending approval · ${summary.completedCategories} categories · ${summary.published} published`}
      action={
        <Button size="sm" disabled={busy} onClick={() => void handlePublishAll()}>
          Publish approved
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MiniStat label="Pending" value={summary.pendingApprovals} />
        <MiniStat label="Categories done" value={summary.completedCategories} />
        <MiniStat label="Published" value={summary.published} />
      </div>

      {summary.results.length === 0 ? (
        <EmptyState
          title="No results yet"
          description="Results appear after judges submit scores."
          className="py-6"
        />
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-2 py-2 font-medium">Participant</th>
                <th className="px-2 py-2 font-medium">Rank</th>
                <th className="px-2 py-2 font-medium">Score</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {summary.results.map((result) => (
                <tr key={result.id} className="border-b border-border/60">
                  <td className="px-2 py-3">{result.participantName ?? 'Participant'}</td>
                  <td className="px-2 py-3">{result.rank ?? '—'}</td>
                  <td className="px-2 py-3">{result.totalScore ?? '—'}</td>
                  <td className="px-2 py-3 capitalize">{result.status}</td>
                  <td className="px-2 py-3">
                    {result.status === 'provisional' && (
                      <Button size="sm" variant="secondary" disabled={busy} onClick={() => void handleApprove(result.id)}>
                        Approve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[12px] border border-border px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}
