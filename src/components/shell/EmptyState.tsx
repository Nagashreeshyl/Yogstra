import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  /** What happens after the user completes the first action */
  outcome?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  outcome,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}
      role="status"
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h2 className="font-heading text-xl font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md leading-relaxed">{description}</p>
      )}
      {outcome && (
        <p className="mt-3 text-xs text-muted-foreground max-w-md leading-relaxed">{outcome}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
