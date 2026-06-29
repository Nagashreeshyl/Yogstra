import { TrendingUp } from 'lucide-react'

interface RankingCardProps {
  label: string
  rank: number | null
  scope?: string
  trend?: 'up' | 'down' | 'flat'
}

export function RankingCard({ label, rank, scope, trend }: RankingCardProps) {
  return (
    <div className="rounded-[16px] border border-border bg-elevated p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="font-heading text-3xl font-bold text-foreground">
          {rank !== null ? `#${rank}` : '—'}
        </p>
        {trend && rank !== null && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trend === 'up' ? 'text-primary' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            <TrendingUp
              className={`h-3.5 w-3.5 ${trend === 'down' ? 'rotate-180' : trend === 'flat' ? 'opacity-40' : ''}`}
              aria-hidden
            />
          </span>
        )}
      </div>
      {scope && <p className="mt-1 text-xs text-muted-foreground">{scope}</p>}
    </div>
  )
}
