import type { ReactNode } from 'react'

interface PreparationCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function PreparationCard({ title, description, action, children, className = '' }: PreparationCardProps) {
  return (
    <section className={`rounded-[16px] border border-border bg-elevated p-5 shadow-sm ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}
