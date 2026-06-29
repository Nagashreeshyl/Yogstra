import { useState } from 'react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../shell/EmptyState'
import type { OrganizerCertificateSummary } from '../../../services/organizerDashboard'
import { issueCertificate } from '../../../services/certificateService'

interface CertificateQueueProps {
  summary: OrganizerCertificateSummary
  onUpdated: () => void
}

export function CertificateQueue({ summary, onUpdated }: CertificateQueueProps) {
  const [busy, setBusy] = useState(false)

  async function handleIssueAll() {
    const drafts = summary.certificates.filter((c) => c.status === 'draft')
    if (drafts.length === 0) return
    setBusy(true)
    try {
      for (const cert of drafts) {
        await issueCertificate(cert.id, {
          signedBy: 'Yogstra Platform',
          signedAt: new Date().toISOString(),
        })
      }
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardCard
      title="Certificates"
      description={`${summary.pendingGeneration} pending · ${summary.issued} issued`}
      action={
        <Button size="sm" disabled={busy || summary.pendingGeneration === 0} onClick={() => void handleIssueAll()}>
          Generate pending
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Pending" value={summary.pendingGeneration} />
        <Stat label="Generated" value={summary.generated} />
        <Stat label="Issued" value={summary.issued} />
      </div>

      {summary.certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Issue certificates after results are approved."
          className="py-6"
        />
      ) : (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {summary.certificates.slice(0, 8).map((cert) => (
            <li
              key={cert.id}
              className="flex items-center justify-between gap-2 rounded-[12px] border border-border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{cert.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{cert.status}</p>
              </div>
              {cert.verificationUrl && cert.status === 'issued' && (
                <a href={cert.verificationUrl} className="text-xs text-primary hover:underline shrink-0">
                  Verify
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[12px] border border-border bg-muted/20 px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
