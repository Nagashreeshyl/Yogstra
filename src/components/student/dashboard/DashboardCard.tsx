import type { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardCard({
  title,
  description,
  action,
  children,
  className = '',
}: DashboardCardProps) {
  return (
    <section
      className={`rounded-[16px] border border-border bg-elevated p-5 sm:p-6 shadow-sm ${className}`}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      {children}
    </section>
  )
}
