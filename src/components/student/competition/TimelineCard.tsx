import type { CompetitionTimelineStage } from '../../../services/studentCompetitionExperience'

interface TimelineCardProps {
  stages: CompetitionTimelineStage[]
}

function stageIcon(status: CompetitionTimelineStage['status']) {
  if (status === 'completed') return '✓'
  if (status === 'current') return '●'
  return '○'
}

export function TimelineCard({ stages }: TimelineCardProps) {
  return (
    <ol className="student-competition-timeline space-y-0" aria-label="Competition timeline">
      {stages.map((stage, index) => (
        <li
          key={stage.id}
          className={`relative flex gap-4 pb-6 last:pb-0 ${
            index < stages.length - 1
              ? "before:absolute before:left-[11px] before:top-6 before:h-[calc(100%-12px)] before:w-0.5 before:bg-border"
              : ''
          }`}
        >
          <span
            className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              stage.status === 'completed'
                ? 'bg-primary text-primary-foreground'
                : stage.status === 'current'
                  ? 'bg-accent text-accent-foreground ring-4 ring-accent/20'
                  : 'border border-border bg-elevated text-muted-foreground'
            }`}
            aria-hidden
          >
            {stageIcon(stage.status)}
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3
                className={`font-heading text-sm font-semibold ${
                  stage.status === 'current' ? 'text-primary' : 'text-foreground'
                }`}
              >
                {stage.label}
                {stage.status === 'current' && (
                  <span className="ml-2 text-xs font-normal text-primary">Current</span>
                )}
              </h3>
              {stage.dateLabel && (
                <time className="text-xs text-muted-foreground">
                  {new Date(stage.dateLabel).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{stage.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
