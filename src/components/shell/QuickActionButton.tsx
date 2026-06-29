import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Plus } from 'lucide-react'

interface QuickActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  showIcon?: boolean
}

export function QuickActionButton({
  children = 'Quick action',
  showIcon = true,
  className = '',
  ...props
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-[12px] bg-primary text-primary-foreground hover:bg-primary-hover transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {showIcon && <Plus size={16} strokeWidth={2} />}
      {children}
    </button>
  )
}
