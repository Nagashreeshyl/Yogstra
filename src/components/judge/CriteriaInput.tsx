import type { ScoringCriterion } from '../../types/judgePortal'

interface CriteriaInputProps {
  criterion: ScoringCriterion
  value: number | ''
  error?: string
  disabled?: boolean
  onChange: (value: number | '') => void
}

export function CriteriaInput({
  criterion,
  value,
  error,
  disabled,
  onChange,
}: CriteriaInputProps) {
  const min = criterion.minScore ?? (criterion.type === 'penalty' ? -criterion.maxScore : 0)
  const max = criterion.maxScore

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`criterion-${criterion.key}`} className="text-base font-medium text-foreground">
          {criterion.label}
        </label>
        <span className="text-xs text-muted-foreground">
          {min} – {max}
          {criterion.type === 'penalty' ? ' (penalty)' : ''}
        </span>
      </div>
      <input
        id={`criterion-${criterion.key}`}
        type="number"
        inputMode="decimal"
        step="0.1"
        min={min}
        max={max}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const next = e.target.value
          onChange(next === '' ? '' : Number(next))
        }}
        className={`w-full rounded-[12px] border bg-elevated px-4 py-4 text-2xl font-semibold text-center min-h-[56px] touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? 'border-red-500' : 'border-border'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${criterion.key}-error` : undefined}
      />
      {error && (
        <p id={`${criterion.key}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
