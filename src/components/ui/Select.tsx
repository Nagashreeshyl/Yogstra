import type { SelectHTMLAttributes, ReactNode } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  children: ReactNode
}

export function Select({ label, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-charcoal">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full px-4 py-2.5 bg-cream border border-border rounded-sm text-charcoal focus:outline-none focus:border-teal transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}
