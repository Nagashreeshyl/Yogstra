import { Badge } from '../../ui/Badge'
import type { CompetitionStatus } from '../../../domain/competition/models'
import { formatCompetitionStatus } from '../../../domain/competition/permissions'

const STATUS_VARIANT: Record<
  CompetitionStatus,
  'default' | 'primary' | 'verified' | 'accent' | 'muted'
> = {
  draft: 'muted',
  published: 'primary',
  registration_open: 'verified',
  registration_closed: 'accent',
  in_progress: 'verified',
  scoring: 'accent',
  results_pending: 'accent',
  completed: 'primary',
  archived: 'default',
}

interface CompetitionStatusBannerProps {
  status: CompetitionStatus
  className?: string
}

export function CompetitionStatusBanner({ status, className = '' }: CompetitionStatusBannerProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Current status</span>
      <Badge variant={STATUS_VARIANT[status]}>{formatCompetitionStatus(status)}</Badge>
    </div>
  )
}
