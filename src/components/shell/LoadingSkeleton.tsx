interface LoadingSkeletonProps {
  variant?: 'page' | 'inline'
  className?: string
}

function Block({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-[12px] bg-muted ${className}`} aria-hidden />
}

export function LoadingSkeleton({ variant = 'page', className = '' }: LoadingSkeletonProps) {
  if (variant === 'inline') {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-label="Loading">
        <Block className="h-4 w-3/5" />
        <Block className="h-4 w-full" />
        <Block className="h-4 w-4/5" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  return (
    <div className={`px-4 py-8 sm:px-6 lg:px-8 max-w-6xl mx-auto ${className}`} role="status" aria-label="Loading">
      <Block className="h-8 w-48 mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-[16px] border border-border p-4 space-y-3">
            <Block className="h-5 w-2/3" />
            <Block className="h-4 w-full" />
            <Block className="h-4 w-4/5" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading page…</span>
    </div>
  )
}
