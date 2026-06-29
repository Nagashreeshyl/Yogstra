import type { CompetitionParticipant } from '../../domain/competition/models'
import type { CompetitionScore } from '../../domain/competition/models'

interface ParticipantQueueProps {
  participants: CompetitionParticipant[]
  scoreByParticipant: Map<string, CompetitionScore>
  activeParticipantId: string | null
  onSelect: (participantId: string) => void
}

export function ParticipantQueue({
  participants,
  scoreByParticipant,
  activeParticipantId,
  onSelect,
}: ParticipantQueueProps) {
  if (participants.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No participants in this category yet.
      </p>
    )
  }

  return (
    <ul className="space-y-2" role="listbox" aria-label="Participant queue">
      {participants.map((participant, index) => {
        const score = scoreByParticipant.get(participant.id)
        const isActive = activeParticipantId === participant.id
        const isScored = score?.status === 'submitted' || score?.status === 'locked'

        return (
          <li key={participant.id}>
            <button
              type="button"
              role="option"
              aria-selected={isActive}
              onClick={() => onSelect(participant.id)}
              className={`w-full flex items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors min-h-[56px] touch-manipulation ${
                isActive
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-foreground truncate">
                  {participant.displayName}
                </span>
                <span className="block text-xs text-muted-foreground capitalize">
                  {participant.status.replace(/_/g, ' ')}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  isScored
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isScored ? (score?.status === 'locked' ? 'Locked' : 'Done') : 'Pending'}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
