import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-charcoal">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 bg-cream border border-border rounded-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-teal transition-colors ${className}`}
        {...props}
      />
    </div>
  )
}
