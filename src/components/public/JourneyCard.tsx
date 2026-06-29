import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

type JourneyStep = { label: string }

type JourneyCardProps = {
  emoji: string
  title: string
  description: string
  steps: JourneyStep[]
  to: string
  cta?: string
}

export function JourneyCard({ emoji, title, description, steps, to, cta = 'Continue' }: JourneyCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-[20px] border border-border bg-elevated p-6 sm:p-8 transition-all duration-200 hover:border-accent/40 hover:shadow-lg hover:shadow-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <span className="text-3xl mb-4" aria-hidden>
        {emoji}
      </span>
      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">{description}</p>
      <ol className="space-y-1.5 mb-6">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-foreground">
              {index + 1}
            </span>
            {step.label}
          </li>
        ))}
      </ol>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent group-hover:gap-2.5 transition-all">
        {cta}
        <ArrowRight size={16} />
      </span>
    </Link>
  )
}

export function JourneyGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">{children}</div>
}
