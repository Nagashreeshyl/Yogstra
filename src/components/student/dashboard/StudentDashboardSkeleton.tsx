import { LoadingSkeleton } from '../../shell/LoadingSkeleton'

export function StudentDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8 space-y-3">
        <div className="h-4 w-28 rounded-[12px] bg-muted animate-pulse" />
        <div className="h-9 w-64 max-w-full rounded-[12px] bg-muted animate-pulse" />
        <div className="h-8 w-48 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-[16px] bg-muted animate-pulse" />
        ))}
      </div>
      <LoadingSkeleton variant="page" className="px-0 py-0 max-w-none" />
    </div>
  )
}
