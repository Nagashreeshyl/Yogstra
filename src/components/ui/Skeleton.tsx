interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-sm bg-surface-inset/80 ${className}`}
      aria-hidden
    />
  )
}

export function ProfilePageSkeleton() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row gap-8 mb-8 pb-8 border-b border-border">
        <Skeleton className="w-40 h-40 rounded-full shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-2/3 max-w-sm" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-36 mt-2" />
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}

export function TeacherCardSkeleton() {
  return (
    <div className="border border-border rounded-sm overflow-hidden bg-cream h-[440px] flex flex-col">
      <Skeleton className="w-full h-[280px] rounded-none" />
      <div className="p-4 space-y-3 flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-9 w-full mt-auto" />
      </div>
    </div>
  )
}

export function TeacherGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <TeacherCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function UserDirectorySkeleton() {
  return (
    <div className="border border-border rounded-sm overflow-hidden bg-cream shrink-0 w-full md:w-72 h-full">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 border-b border-border">
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChatWindowSkeleton() {
  return (
    <div className="flex flex-col h-full min-h-[420px] bg-cream-dark border border-border rounded-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-charcoal flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full bg-cream/20" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-cream/20" />
          <Skeleton className="h-3 w-24 bg-cream/10" />
        </div>
      </div>
      <div className="flex-1 p-4 space-y-3 bg-cream-dark">
        <div className="flex justify-start">
          <Skeleton className="h-12 w-48 rounded-2xl" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-56 rounded-2xl" />
        </div>
        <div className="flex justify-start">
          <Skeleton className="h-14 w-64 rounded-2xl" />
        </div>
      </div>
      <div className="px-3 py-2.5 border-t border-border flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      </div>
    </div>
  )
}

export function PostFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6 max-w-[470px]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border rounded-sm bg-cream overflow-hidden">
          <div className="flex items-center gap-3 p-3 border-b border-border">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="w-full aspect-[4/5] rounded-none max-h-[585px]" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminChatSkeleton() {
  return (
    <div className="flex gap-6 h-[calc(100vh-220px)]">
      <div className="w-80 shrink-0 border border-border rounded-sm bg-cream p-2 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="flex-1 min-h-[400px]" />
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3 mb-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

export function ScheduleCalendarSkeleton() {
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <Skeleton className="h-12 w-full rounded-none" />
      <div className="grid grid-cols-7 gap-px bg-border p-px">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="min-h-[72px] rounded-none" />
        ))}
      </div>
    </div>
  )
}

export function TeacherDashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    </div>
  )
}

export function TeacherTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-border rounded-sm divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-none" />
      ))}
    </div>
  )
}

export function TeacherEarningsSkeleton() {
  return (
    <div className="p-8 space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <TeacherTableSkeleton rows={4} />
    </div>
  )
}

export function NotificationsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-7 w-36" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <li key={i} className="border border-border rounded-sm p-4 bg-cream space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-16 w-full" />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AdminDashboardSkeleton() {
  return (
    <div className="p-8 space-y-8">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function SimplePageSkeleton() {
  return (
    <div className="p-8 max-w-2xl space-y-4">
      <PageHeaderSkeleton />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

export function SettingsFormSkeleton() {
  return (
    <div className="p-8 max-w-lg space-y-6">
      <PageHeaderSkeleton />
      <div className="flex items-center gap-6 pb-8 border-b border-border">
        <Skeleton className="w-22 h-22 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function MessagesHubSkeleton() {
  return (
    <div className="p-4 sm:p-8 h-full flex flex-col min-h-0">
      <Skeleton className="h-7 w-32 mb-4" />
      <div className="flex gap-2 mb-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-[420px]">
        <UserDirectorySkeleton />
        <div className="flex-1 hidden md:block">
          <ChatWindowSkeleton />
        </div>
      </div>
    </div>
  )
}
