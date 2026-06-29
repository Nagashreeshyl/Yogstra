import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this content. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-16 ${className}`}
      role="alert"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[16px] bg-destructive/10 text-destructive">
        <AlertCircle size={24} />
      </div>
      <h2 className="font-heading text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-[12px] border border-border bg-background hover:bg-muted transition-colors cursor-pointer"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      )}
    </div>
  )
}
