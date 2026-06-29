import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  padding?: 'none' | 'sm' | 'md'
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
}

/** V2 card surface — matches DashboardCard styling */
export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[16px] border border-border bg-elevated shadow-sm ${paddingClasses[padding]} ${onClick ? 'cursor-pointer transition-colors hover:border-primary/40' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
