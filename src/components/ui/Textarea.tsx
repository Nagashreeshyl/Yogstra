import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`min-h-[100px] w-full resize-y rounded-[12px] border border-border bg-elevated px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${error ? 'border-destructive' : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </div>
  )
}
