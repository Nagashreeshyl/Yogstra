import { useMemo, useState } from 'react'
import { Check, Download, X } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../shell/EmptyState'
import type { OrganizerRegistrationSummary } from '../../../services/organizerDashboard'
import {
  bulkUpdateRegistrationStatus,
  confirmRegistrationPayment,
  exportRegistrationsCsv,
  updateRegistrationStatus,
} from '../../../services/organizerOperations'

interface RegistrationTableProps {
  summary: OrganizerRegistrationSummary
  onUpdated: () => void
}

function RegistrationRowActions({
  registration,
  busy,
  onConfirmPayment,
  onStatus,
}: {
  registration: OrganizerRegistrationSummary['registrations'][number]
  busy: boolean
  onConfirmPayment: (id: string) => void
  onStatus: (id: string, status: 'confirmed' | 'rejected') => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {registration.paymentStatus !== 'paid' && registration.paymentStatus !== 'waived' && (
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => onConfirmPayment(registration.id)}
        >
          Mark paid
        </Button>
      )}
      {registration.status === 'pending' && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus(registration.id, 'confirmed')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border hover:bg-muted"
            aria-label="Approve"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => onStatus(registration.id, 'rejected')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border hover:bg-muted"
            aria-label="Reject"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  )
}

export function RegistrationTable({ summary, onUpdated }: RegistrationTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const allSelected = useMemo(
    () => summary.registrations.length > 0 && selected.size === summary.registrations.length,
    [selected.size, summary.registrations.length],
  )

  async function handleConfirmPayment(id: string) {
    setBusy(true)
    try {
      await confirmRegistrationPayment(id)
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

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
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'registrations.csv'
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(summary.registrations.map((r) => r.id)))
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  return (
    <DashboardCard
      title="Registrations"
      description={`${summary.total} total · ${summary.pendingApprovals} pending · ${summary.paymentsPending} unpaid`}
      action={
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
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
        <>
          <div className="mb-3 flex items-center gap-2 md:hidden">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              aria-label="Select all registrations"
            />
            <span className="text-xs text-muted-foreground">Select all</span>
          </div>

          <ul className="space-y-3 md:hidden">
            {summary.registrations.map((registration) => (
              <li
                key={registration.id}
                className="rounded-[12px] border border-border bg-muted/20 p-4"
              >
                <div className="mb-3 flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(registration.id)}
                    onChange={() => toggleOne(registration.id)}
                    aria-label={`Select ${registration.registrantName ?? 'registration'}`}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{registration.registrantName ?? 'Unknown'}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {registration.registrantType} · {registration.status}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                    {registration.paymentStatus}
                  </span>
                </div>
                <RegistrationRowActions
                  registration={registration}
                  busy={busy}
                  onConfirmPayment={(id) => void handleConfirmPayment(id)}
                  onStatus={(id, status) => void handleStatus(id, status)}
                />
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
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
                        onChange={() => toggleOne(registration.id)}
                        aria-label={`Select ${registration.registrantName ?? 'registration'}`}
                      />
                    </td>
                    <td className="px-2 py-3 font-medium">{registration.registrantName ?? 'Unknown'}</td>
                    <td className="px-2 py-3 capitalize">{registration.registrantType}</td>
                    <td className="px-2 py-3 capitalize">{registration.status}</td>
                    <td className="px-2 py-3 capitalize">{registration.paymentStatus}</td>
                    <td className="px-2 py-3">
                      <RegistrationRowActions
                        registration={registration}
                        busy={busy}
                        onConfirmPayment={(id) => void handleConfirmPayment(id)}
                        onStatus={(id, status) => void handleStatus(id, status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DashboardCard>
  )
}
