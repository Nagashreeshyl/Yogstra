import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className = '', id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-charcoal">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`w-full px-4 py-2.5 bg-cream border border-border rounded-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-teal transition-colors resize-y min-h-[100px] ${className}`}
        {...props}
      />
    </div>
  )
}
