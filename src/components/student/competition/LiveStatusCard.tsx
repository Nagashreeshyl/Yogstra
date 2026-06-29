import { Clock, Megaphone, Radio, Users } from 'lucide-react'
import type { CompetitionAnnouncement, CompetitionParticipant } from '../../../domain/competition/models'

interface LiveStatusCardProps {
  checkInStatus: string
  currentStage: string
  participants: CompetitionParticipant[]
  myParticipantId?: string
  estimatedTime?: string | null
  announcements: CompetitionAnnouncement[]
}

export function LiveStatusCard({
  checkInStatus,
  currentStage,
  participants,
  myParticipantId,
  estimatedTime,
  announcements,
}: LiveStatusCardProps) {
  const ordered = [...participants].sort((a, b) => {
    const orderA = (a.metadata?.performanceOrder as number | undefined) ?? 999
    const orderB = (b.metadata?.performanceOrder as number | undefined) ?? 999
    return orderA - orderB
  })

  return (
    <div className="student-competition-live space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
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
      </div>

      {estimatedTime && (
        <div className="flex items-center gap-2 rounded-[12px] bg-accent/10 px-4 py-3 text-sm">
          <Clock className="h-4 w-4 text-accent-foreground" aria-hidden />
          <span>
            Estimated performance time: <strong>{estimatedTime}</strong>
          </span>
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
                  {p.id === myParticipantId && (
                    <span className="ml-2 text-xs text-primary">You</span>
                  )}
                </span>
                <span className="text-xs capitalize text-muted-foreground">{p.status.replace(/_/g, ' ')}</span>
              </li>
            ))
          )}
        </ol>
      </div>

      {announcements.length > 0 && (
        <div>
          <h3 className="mb-2 flex items-center gap-2 font-heading text-sm font-semibold">
            <Megaphone className="h-4 w-4" aria-hidden />
            Announcements
          </h3>
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li
                key={a.id}
                className="rounded-[12px] border border-border bg-muted/30 px-4 py-3 text-sm"
              >
                <p className="font-medium">{a.title}</p>
                {a.body && <p className="mt-1 text-muted-foreground">{a.body}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
