import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useLiveDataRefresh } from '../hooks/useLiveDataRefresh'
import { fetchTeachers } from '../services/teachers'
import { filterTeachers } from '../utils/filterTeachers'
import { PageContainer } from '../components/shell/PageContainer'
import { PageHeader } from '../components/shell/PageHeader'
import { EmptyState } from '../components/shell/EmptyState'
import { SearchBar } from '../components/filters/SearchBar'
import { CategoryFlashCards } from '../components/categories/CategoryFlashCards'
import { TeacherCard } from '../components/teachers/TeacherCard'
import { Button } from '../components/ui/Button'
import { TeacherGridSkeleton } from '../components/ui/Skeleton'

// VERIFIED: Find Teachers — Supabase list, category filter, search, pagination
const PAGE_SIZE = 6

export function FindTeachersPage() {
  const { searchQuery, filters, selectedCategory, setSearchQuery } = useApp()
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q && q !== searchQuery) setSearchQuery(q)
  }, [searchParams, searchQuery, setSearchQuery])
  const { data: teachers, loading, refetch } = useAsyncData(() => fetchTeachers(true))

  useLiveDataRefresh(refetch, ['teachers'])

  const filtered = filterTeachers(teachers ?? [], searchQuery, filters, selectedCategory)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader title="Find Teachers" description="Browse verified yoga teachers across India." />

        <SearchBar />
        <CategoryFlashCards onSelect={() => setPage(1)} />

        {loading ? (
          <TeacherGridSkeleton count={PAGE_SIZE} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No teachers match your filters" description="Try adjusting your search or category filters." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((t) => (
              <TeacherCard key={t.id} teacher={t} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-9 w-9 text-sm rounded-[12px] cursor-pointer ${
                  p === page ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {p}
              </button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
