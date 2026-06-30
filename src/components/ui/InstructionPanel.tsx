import { useState } from 'react'
import { X } from 'lucide-react'

export type InstructionStep = {
  label: string
}

type InstructionPanelProps = {
  title: string
  steps: InstructionStep[]
  /** Unique key for persisting dismiss state in localStorage */
  storageKey: string
  className?: string
}

function isDismissed(key: string): boolean {
  try {
    return localStorage.getItem(`yogstra-instruction-${key}`) === '1'
  } catch {
    return false
  }
}

function dismiss(key: string) {
  try {
    localStorage.setItem(`yogstra-instruction-${key}`, '1')
  } catch {
    /* ignore */
  }
}

export function InstructionPanel({ title, steps, storageKey, className = '' }: InstructionPanelProps) {
  const [visible, setVisible] = useState(() => !isDismissed(storageKey))

  if (!visible) return null

  return (
    <aside
      className={`rounded-[16px] border border-border bg-muted/30 p-4 sm:p-5 ${className}`}
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <button
          type="button"
          onClick={() => {
            dismiss(storageKey)
            setVisible(false)
          }}
          className="shrink-0 rounded-[10px] p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Dismiss instructions"
        >
          <X size={16} />
        </button>
      </div>
      <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-2">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-semibold text-accent">
              {index + 1}
            </span>
            {step.label}
          </li>
        ))}
      </ol>
    </aside>
  )
}
