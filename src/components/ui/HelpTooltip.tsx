import type { ReactNode } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { Info } from 'lucide-react'

const MAX_WORDS = 120

export type HelpTooltipProps = {
  /** Short field or action name shown in the tooltip header */
  label: string
  /** 1–2 sentence explanation */
  description: string
  /** Example value */
  example?: string
  /** Best practice tip */
  bestPractice?: string
  /** Validation or format hint */
  validationHint?: string
  className?: string
}

function countWords(parts: string[]): number {
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}

export function HelpTooltip({
  label,
  description,
  example,
  bestPractice,
  validationHint,
  className = '',
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const panelId = `${id}-help`
  const ref = useRef<HTMLSpanElement>(null)

  const wordCount = countWords([description, example ?? '', bestPractice ?? '', validationHint ?? ''])
  if (import.meta.env.DEV && wordCount > MAX_WORDS) {
    console.warn(`HelpTooltip "${label}" exceeds ${MAX_WORDS} words (${wordCount})`)
  }

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <span ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        aria-label={`Help: ${label}`}
        aria-expanded={open}
        aria-controls={panelId}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false)
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <Info size={14} aria-hidden />
      </button>

      {open && (
        <span
          id={panelId}
          role="tooltip"
          className="absolute left-1/2 bottom-full z-[90] mb-2 w-72 -translate-x-1/2 rounded-[14px] border border-border bg-elevated p-4 text-left shadow-lg"
        >
          <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
          <span className="block text-xs text-muted-foreground leading-relaxed">{description}</span>
          {example && (
            <span className="mt-2 block text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Example: </span>
              {example}
            </span>
          )}
          {bestPractice && (
            <span className="mt-2 block text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Tip: </span>
              {bestPractice}
            </span>
          )}
          {validationHint && (
            <span className="mt-2 block text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Note: </span>
              {validationHint}
            </span>
          )}
        </span>
      )}
    </span>
  )
}

/** Label row with optional contextual help icon */
export function LabelWithHelp({
  htmlFor,
  children,
  help,
}: {
  htmlFor?: string
  children: ReactNode
  help?: HelpTooltipProps
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {children}
      </label>
      {help && <HelpTooltip {...help} />}
    </div>
  )
}
