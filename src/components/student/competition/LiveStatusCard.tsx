import { Clock, Megaphone, Radio, Users } from 'lucide-react'
import type { CompetitionAnnouncement, CompetitionParticipant, CompetitionScore } from '../../../domain/competition/models'

interface LiveStatusCardProps {
  checkInStatus: string
  currentStage: string
  participants: CompetitionParticipant[]
  myParticipantId?: string
  estimatedTime?: string | null
  queuePosition?: number | null
  announcements: CompetitionAnnouncement[]
  emergencyContact?: { name: string; phone: string; relation: string }
  liveScores?: CompetitionScore[]
}

export function LiveStatusCard({
  checkInStatus,
  currentStage,
  participants,
  myParticipantId,
  estimatedTime,
  queuePosition,
  emergencyContact,
  liveScores = [],
}: LiveStatusCardProps) {
  const ordered = [...participants].sort((a, b) => {
    const orderA = (a.metadata?.performanceOrder as number | undefined) ?? 999
    const orderB = (b.metadata?.performanceOrder as number | undefined) ?? 999
    return orderA - orderB
  })

  return (
    <div className="student-competition-live space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-[12px] border border-border bg-elevated p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Radio className="h-4 w-4 text-primary" aria-hidden />
            Current stage
          </div>
          <p className="mt-1 font-heading text-lg font-semibold">{currentStage}</p>
        </div>
        <div className="rounded-[12px] border border-border bg-elevated p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" aria-hidden />
            Check-in
          </div>
          <p className="mt-1 font-heading text-lg font-semibold">{checkInStatus}</p>
        </div>
        {queuePosition !== null && queuePosition !== undefined && queuePosition > 0 && (
          <div className="rounded-[12px] border border-border bg-elevated p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Megaphone className="h-4 w-4" aria-hidden />
              Queue position
            </div>
            <p className="mt-1 font-heading text-lg font-semibold">#{queuePosition}</p>
          </div>
        )}
      </div>

      {estimatedTime && (
        <div className="flex items-center gap-2 rounded-[12px] bg-accent/10 px-4 py-3 text-sm">
          <Clock className="h-4 w-4" aria-hidden />
          Estimated performance: <strong>{estimatedTime}</strong>
        </div>
      )}

      {emergencyContact && (
        <div className="rounded-[12px] border border-border bg-muted/30 px-4 py-3 text-sm">
          <p className="font-medium">Emergency contact</p>
          <p className="text-muted-foreground">
            {emergencyContact.name} ({emergencyContact.relation}) · {emergencyContact.phone}
          </p>
        </div>
      )}

      {liveScores.length > 0 && (
        <div className="rounded-[12px] border border-border bg-elevated p-4">
          <p className="text-sm font-medium">Live scores</p>
          <p className="font-heading text-2xl font-bold">{liveScores[0]?.totalScore?.toFixed(2)}</p>
        </div>
      )}

      <div>
        <h3 className="mb-2 font-heading text-sm font-semibold">Participant order</h3>
        <ol className="divide-y divide-border rounded-[12px] border border-border bg-elevated">
          {ordered.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">Order not published yet.</li>
          ) : (
            ordered.map((p, index) => (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 text-sm ${
                  p.id === myParticipantId ? 'bg-primary/5 font-medium' : ''
                }`}
              >
                <span>
                  {index + 1}. {p.displayName}
                  {p.id === myParticipantId && <span className="ml-2 text-xs text-primary">You</span>}
                </span>
                <span className="text-xs capitalize text-muted-foreground">{p.status.replace(/_/g, ' ')}</span>
              </li>
            ))
          )}
        </ol>
      </div>
    </div>
  )
}
