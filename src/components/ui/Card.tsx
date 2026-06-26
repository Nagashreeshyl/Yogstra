import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-cream border border-border rounded-sm ${onClick ? 'cursor-pointer hover:border-teal/50 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
