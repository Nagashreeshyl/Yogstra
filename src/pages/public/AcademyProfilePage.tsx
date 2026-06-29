import { Link, useParams } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAcademyBySlug } from '../../services/academyService'
import { PageContainer } from '../../components/shell/PageContainer'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

export function AcademyProfilePage() {
  const { slug = '' } = useParams()
  const { data: academy, loading, error, refetch } = useAsyncData(
    () => fetchAcademyBySlug(slug),
    [slug],
    { enabled: Boolean(slug) },
  )

  if (loading) return <LoadingSkeleton />
  if (error || !academy) {
    return (
      <PageContainer>
        <ErrorState message={error ?? 'Academy not found.'} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide" className="py-10 sm:py-14">
      <div className="rounded-[24px] border border-border bg-elevated overflow-hidden mb-10">
        <div className="aspect-[21/9] bg-sidebar-secondary flex items-center justify-center">
          {academy.logoUrl ? (
            <img src={academy.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 size={56} className="text-accent/50" />
          )}
        </div>
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-3xl font-semibold text-foreground">{academy.name}</h1>
              <p className="flex items-center gap-1 text-muted-foreground mt-2">
                <MapPin size={16} className="text-accent" />
                {[academy.city, academy.state].filter(Boolean).join(', ') || 'India'}
              </p>
            </div>
            <Badge variant="primary">{academy.status}</Badge>
          </div>
          {academy.description && (
            <p className="mt-6 text-muted-foreground leading-relaxed max-w-3xl">{academy.description}</p>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth/get-started">
              <Button>Join Academy</Button>
            </Link>
            <Link to="/academies">
              <Button variant="secondary">Browse all academies</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Teachers', 'Programs', 'Facilities'].map((section) => (
          <div key={section} className="rounded-[16px] border border-border bg-elevated p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground mb-2">{section}</h2>
            <p className="text-sm text-muted-foreground">
              Contact the academy or sign in as a member to view full {section.toLowerCase()} details.
            </p>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
