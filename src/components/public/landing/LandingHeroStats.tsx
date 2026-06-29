import type { LandingStats } from '../../../services/landingService'

type LandingHeroStatsProps = {
  stats: LandingStats | null
  loading: boolean
}

function StatItem({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="rounded-[16px] border border-border/60 bg-background/50 px-4 py-3 text-center backdrop-blur-sm">
      <p className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">
        {loading ? '—' : value.toLocaleString('en-IN')}
      </p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

export function LandingHeroStats({ stats, loading }: LandingHeroStatsProps) {
  return (
    <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl">
      <StatItem label="Registered Students" value={stats?.students ?? 0} loading={loading} />
      <StatItem label="Verified Coaches" value={stats?.verifiedCoaches ?? 0} loading={loading} />
      <StatItem label="Academies" value={stats?.academies ?? 0} loading={loading} />
      <StatItem label="Competitions" value={stats?.competitions ?? 0} loading={loading} />
    </div>
  )
}
