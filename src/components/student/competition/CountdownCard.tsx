interface CountdownCardProps {
  daysUntil: number | null
  label?: string
}

export function CountdownCard({ daysUntil, label = 'Countdown' }: CountdownCardProps) {
  return (
    <div
      className="rounded-[16px] border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-5 text-center"
      aria-live="polite"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-4xl font-bold text-primary">
        {daysUntil !== null && daysUntil >= 0 ? daysUntil : '—'}
      </p>
      <p className="text-sm text-muted-foreground">
        {daysUntil === 0 ? 'Competition day!' : daysUntil !== null && daysUntil >= 0 ? 'days to go' : 'Date TBA'}
      </p>
    </div>
  )
}
