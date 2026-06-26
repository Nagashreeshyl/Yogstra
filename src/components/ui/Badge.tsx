import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'teal' | 'v2' | 'verified' | 'mode'
  className?: string
}

const variants = {
  default: 'bg-cream-dark text-charcoal border-border',
  teal: 'bg-teal-soft text-charcoal border-teal/30',
  v2: 'bg-cream-dark text-charcoal/60 border-border text-xs',
  verified: 'bg-teal-soft text-charcoal border-teal/30',
  mode: 'bg-cream-dark text-charcoal border-border',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-sm ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
