import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '../ui/Button'

type JourneyCardProps = {
  icon: LucideIcon
  title: string
  description: string
  to: string
  cta: string
}

export function JourneyCard({ icon: Icon, title, description, to, cta }: JourneyCardProps) {
  return (
    <article className="group flex flex-col rounded-[24px] border border-border bg-elevated p-8 transition-all duration-200 hover:border-accent/40 hover:shadow-lg hover:shadow-black/10">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-accent/10 text-accent mb-6">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-8 flex-1">{description}</p>
      <Link to={to} className="mt-auto">
        <Button variant="secondary" className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors gap-2">
          {cta}
          <ArrowRight size={16} />
        </Button>
      </Link>
    </article>
  )
}

export function JourneyGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">{children}</div>
}
