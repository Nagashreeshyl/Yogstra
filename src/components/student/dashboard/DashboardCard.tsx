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
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0 w-full sm:w-auto">{action}</div>}
      </header>
      {children}
    </section>
  )
}
