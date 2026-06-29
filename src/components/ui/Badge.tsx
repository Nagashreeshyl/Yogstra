import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'accent' | 'muted' | 'verified' | 'mode'
  className?: string
}

const variants = {
  default: 'bg-muted text-foreground border-border',
  primary: 'bg-primary/10 text-primary border-primary/20',
  accent: 'bg-accent/15 text-accent-foreground border-accent/30',
  muted: 'bg-muted text-muted-foreground border-border text-xs',
  verified: 'bg-primary/10 text-primary border-primary/20',
  mode: 'bg-muted text-foreground border-border',
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[8px] border px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
