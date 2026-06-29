import { Link } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchActiveAcademies } from '../../services/academyService'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useState, useMemo } from 'react'

export function AcademiesPage() {
  const [search, setSearch] = useState('')
  const { data: academies, loading, error, refetch } = useAsyncData(() => fetchActiveAcademies(100))

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (academies ?? []).filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.city ?? '').toLowerCase().includes(q) ||
        (a.state ?? '').toLowerCase().includes(q),
    )
  }, [academies, search])

  if (loading) return <LoadingSkeleton />
  if (error) {
    return (
      <PageContainer>
        <ErrorState message={error} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide" className="py-10 sm:py-14">
      <PageHeader
        title="Academies"
        description="Discover verified yoga academies across India."
        className="mb-8"
      />

      <Input
        placeholder="Search by name or location…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md mb-10"
        aria-label="Search academies"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No academies found"
          description="Try a different search or check back as new academies join Yogstra."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((academy) => (
            <article
              key={academy.id}
              className="rounded-[20px] border border-border bg-elevated overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] bg-sidebar-secondary flex items-center justify-center">
                {academy.logoUrl ? (
                  <img src={academy.logoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Building2 size={40} className="text-accent/60" />
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-heading text-lg font-semibold text-foreground">{academy.name}</h3>
                  <Badge variant="primary">{academy.status}</Badge>
                </div>
                {academy.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{academy.description}</p>
                )}
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-auto mb-4">
                  <MapPin size={14} className="text-accent" />
                  {[academy.city, academy.state].filter(Boolean).join(', ') || 'India'}
                </p>
                <Link to={`/academies/${academy.slug}`}>
                  <Button size="sm" className="w-full">
                    View Academy
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
