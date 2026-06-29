import { useState } from 'react'
import { Check, FileCheck, X } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../shell/EmptyState'
import type { CompetitionParticipant } from '../../../domain/competition/models'
import { verifyParticipantDocuments } from '../../../services/organizerOperations'

interface ParticipantDocumentsPanelProps {
  participants: CompetitionParticipant[]
  onUpdated: () => void
}

export function ParticipantDocumentsPanel({ participants, onUpdated }: ParticipantDocumentsPanelProps) {
  const [busy, setBusy] = useState<string | null>(null)

  async function handleVerify(participantId: string, verified: boolean) {
    setBusy(participantId)
    try {
      await verifyParticipantDocuments(participantId, verified)
      onUpdated()
    } finally {
      setBusy(null)
    }
  }

  const pending = participants.filter((p) => !p.documentsVerified)

  return (
    <DashboardCard
      title="Document verification"
      description={`${participants.length} participants · ${pending.length} pending review`}
    >
      {participants.length === 0 ? (
        <EmptyState
          title="No participants yet"
          description="Participants appear after registrations are confirmed."
          className="py-6"
        />
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {participants.map((participant) => (
            <li
              key={participant.id}
              className="flex items-center justify-between gap-2 rounded-[12px] border border-border px-3 py-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{participant.displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {participant.documentsVerified ? 'Verified' : 'Pending review'}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {!participant.documentsVerified && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy === participant.id}
                    onClick={() => void handleVerify(participant.id, true)}
                    aria-label={`Verify documents for ${participant.displayName}`}
                  >
                    <FileCheck size={14} className="mr-1" aria-hidden />
                    Verify
                  </Button>
                )}
                {participant.documentsVerified && (
                  <button
                    type="button"
                    disabled={busy === participant.id}
                    onClick={() => void handleVerify(participant.id, false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border hover:bg-muted"
                    aria-label={`Revoke verification for ${participant.displayName}`}
                  >
                    <X size={14} />
                  </button>
                )}
                {participant.documentsVerified && (
                  <Check size={16} className="text-emerald-600 self-center" aria-hidden />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
