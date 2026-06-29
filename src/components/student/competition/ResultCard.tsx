import { Download, Medal, Share2 } from 'lucide-react'
import type { CompetitionResult } from '../../../domain/competition/models'

interface ResultCardProps {
  result: CompetitionResult
  competitionName: string
  categoryRank?: number | null
  judgeComments?: string[]
  onDownload?: () => void
  onShare?: () => void
}

export function ResultCard({
  result,
  competitionName,
  categoryRank,
  judgeComments = [],
  onDownload,
  onShare,
}: ResultCardProps) {
  return (
    <article className="rounded-[16px] border border-border bg-elevated p-5 shadow-sm">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{competitionName}</p>
          <h3 className="mt-1 font-heading text-lg font-semibold">
            {result.rank ? `#${result.rank} overall` : 'Participation'}
          </h3>
          {categoryRank && (
            <p className="text-sm text-muted-foreground">Category rank #{categoryRank}</p>
          )}
        </div>
        {result.medal && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium capitalize">
            <Medal className="h-3.5 w-3.5" aria-hidden />
            {result.medal}
          </span>
        )}
      </header>

      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Total score</dt>
          <dd className="font-heading text-xl font-bold">{result.totalScore?.toFixed(2) ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Placement</dt>
          <dd className="font-heading text-xl font-bold">{result.rank ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="capitalize">{result.status}</dd>
        </div>
      </dl>

      {judgeComments.length > 0 && (
        <blockquote className="mb-4 rounded-lg bg-muted/40 px-3 py-2 text-sm italic text-muted-foreground">
          “{judgeComments[0]}”
        </blockquote>
      )}

      <div className="flex flex-wrap gap-2">
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            <Download className="h-4 w-4" aria-hidden />
            Download PDF
          </button>
        )}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Share
          </button>
        )}
      </div>
    </article>
  )
}
