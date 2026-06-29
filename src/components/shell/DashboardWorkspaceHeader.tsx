import type { ReactNode } from 'react'
import { formatTodayDate, getFirstName, getTimeGreeting } from '../../utils/greeting'

export type DashboardWorkspaceHeaderProps = {
  workspaceTitle: string
  description: string
  userName: string
  primaryAction?: ReactNode
  meta?: ReactNode
  className?: string
}

export function DashboardWorkspaceHeader({
  workspaceTitle,
  description,
  userName,
  primaryAction,
  meta,
  className = '',
}: DashboardWorkspaceHeaderProps) {
  const firstName = getFirstName(userName)

  return (
    <header className={`mb-8 lg:mb-10 ${className}`}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="space-y-1">
            <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              {workspaceTitle}
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl">{description}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-lg font-medium text-foreground">{getTimeGreeting(firstName)}</p>
            <p className="text-sm text-muted-foreground">{formatTodayDate()}</p>
          </div>
          {meta && <div className="pt-1">{meta}</div>}
        </div>
        {primaryAction && (
          <div className="flex shrink-0 items-start gap-2">{primaryAction}</div>
        )}
      </div>
    </header>
  )
}
