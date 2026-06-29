import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

type JourneyCardProps = {
  icon: LucideIcon
  title: string
  subtitle: string
  bullets: string[]
  to: string
  cta: string
}

export function JourneyCard({ icon: Icon, title, subtitle, bullets, to, cta }: JourneyCardProps) {
  return (
    <Link
      to={to}
      className="group flex flex-col rounded-[24px] border border-border bg-elevated p-8 sm:p-10 transition-all duration-200 hover:border-accent/40 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 min-h-[320px]"
    >
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-[16px] bg-accent/10 text-accent mb-6">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <h3 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-6">{subtitle}</p>
      <ul className="space-y-2.5 mb-8 flex-1">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            {bullet}
          </li>
        ))}
      </ul>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent group-hover:gap-2.5 transition-all">
        {cta}
        <ArrowRight size={16} />
      </span>
    </Link>
  )
}

export function JourneyGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">{children}</div>
}
