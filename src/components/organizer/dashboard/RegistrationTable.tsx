import { useMemo, useState } from 'react'
import { Check, Download, X } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../shell/EmptyState'
import type { OrganizerRegistrationSummary } from '../../../services/organizerDashboard'
import {
  bulkUpdateRegistrationStatus,
  exportRegistrationsCsv,
  updateRegistrationStatus,
} from '../../../services/organizerOperations'

interface RegistrationTableProps {
  summary: OrganizerRegistrationSummary
  onUpdated: () => void
}

export function RegistrationTable({ summary, onUpdated }: RegistrationTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const allSelected = useMemo(
    () => summary.registrations.length > 0 && selected.size === summary.registrations.length,
    [selected.size, summary.registrations.length],
  )

  async function handleStatus(id: string, status: 'confirmed' | 'rejected') {
    setBusy(true)
    try {
      await updateRegistrationStatus(id, status)
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  async function handleBulkApprove() {
    if (selected.size === 0) return
    setBusy(true)
    try {
      await bulkUpdateRegistrationStatus([...selected], 'confirmed')
      setSelected(new Set())
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  function handleExport() {
    const csv = exportRegistrationsCsv(summary.registrations)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'registrations.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(summary.registrations.map((r) => r.id)))
    }
  }

  return (
    <DashboardCard
      title="Registrations"
      description={`${summary.total} total · ${summary.pendingApprovals} pending · ${summary.paymentsPending} unpaid`}
      action={
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={handleExport} disabled={summary.total === 0}>
            <Download size={14} className="mr-1" aria-hidden />
            Export
          </Button>
          <Button size="sm" onClick={() => void handleBulkApprove()} disabled={busy || selected.size === 0}>
            Bulk approve
          </Button>
        </div>
      }
    >
      {summary.registrations.length === 0 ? (
        <EmptyState
          title="No registrations yet"
          description="Share your competition link when registration opens."
          className="py-8"
        />
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-2 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all registrations"
                  />
                </th>
                <th className="px-2 py-2 font-medium">Registrant</th>
                <th className="px-2 py-2 font-medium">Type</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium">Payment</th>
                <th className="px-2 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary.registrations.map((registration) => (
                <tr key={registration.id} className="border-b border-border/60">
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(registration.id)}
                      onChange={() => {
                        const next = new Set(selected)
                        if (next.has(registration.id)) next.delete(registration.id)
                        else next.add(registration.id)
                        setSelected(next)
                      }}
                      aria-label={`Select ${registration.registrantName ?? 'registration'}`}
                    />
                  </td>
                  <td className="px-2 py-3 font-medium">{registration.registrantName ?? 'Unknown'}</td>
                  <td className="px-2 py-3 capitalize">{registration.registrantType}</td>
                  <td className="px-2 py-3 capitalize">{registration.status}</td>
                  <td className="px-2 py-3 capitalize">{registration.paymentStatus}</td>
                  <td className="px-2 py-3">
                    {registration.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleStatus(registration.id, 'confirmed')}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border hover:bg-muted"
                          aria-label="Approve"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleStatus(registration.id, 'rejected')}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border hover:bg-muted"
                          aria-label="Reject"
                        >
                          <X size={14} />
                        </button>
                      </div>
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
