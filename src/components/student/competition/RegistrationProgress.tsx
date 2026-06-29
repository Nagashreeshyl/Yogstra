interface RegistrationProgressProps {
  step: number
  totalSteps?: number
  labels?: string[]
}

const DEFAULT_LABELS = [
  'Category',
  'Eligibility',
  'Documents',
  'Emergency',
  'Review',
  'Payment',
  'Confirm',
]

export function RegistrationProgress({
  step,
  totalSteps = 7,
  labels = DEFAULT_LABELS,
}: RegistrationProgressProps) {
  const percent = Math.round(((step + 1) / totalSteps) * 100)

  return (
    <div className="student-competition-progress" aria-label={`Registration step ${step + 1} of ${totalSteps}`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          Step {step + 1} of {totalSteps}
        </span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol className="mt-4 hidden gap-1 sm:grid sm:grid-cols-7">
        {labels.map((label, index) => {
          const done = index < step
          const current = index === step
          return (
            <li
              key={label}
              className={`truncate text-center text-[10px] font-medium uppercase tracking-wide ${
                current
                  ? 'text-primary'
                  : done
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
              }`}
              aria-current={current ? 'step' : undefined}
            >
              {label}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
