import { PublicSection } from '../PublicSection'

export function LandingSectionsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((section) => (
        <PublicSection key={section} className={section % 2 === 0 ? 'bg-muted/30' : ''}>
          <div className="h-8 w-48 animate-pulse rounded-[12px] bg-muted mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-[20px] bg-muted/80" />
            ))}
          </div>
        </PublicSection>
      ))}
    </>
  )
}
