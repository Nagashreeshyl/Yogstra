import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchTeachers } from '../services/teachers'
import { filterTeachers } from '../utils/filterTeachers'
import { SearchBar } from '../components/filters/SearchBar'
import { CategoryFlashCards } from '../components/categories/CategoryFlashCards'
import { TeacherCard } from '../components/teachers/TeacherCard'
import { Button } from '../components/ui/Button'

const PAGE_SIZE = 6

export function FindTeachersPage() {
  const { searchQuery, filters, selectedCategory } = useApp()
  const [page, setPage] = useState(1)
  const { data: teachers, loading } = useAsyncData(() => fetchTeachers(true))

  const filtered = filterTeachers(teachers ?? [], searchQuery, filters, selectedCategory)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-6">Find Teachers</h1>

      <div className="space-y-8">
        <SearchBar />
        <CategoryFlashCards onSelect={() => setPage(1)} />

        {loading ? (
          <p className="text-charcoal/50 text-center py-12">Loading teachers...</p>
        ) : filtered.length === 0 ? (
          <p className="text-charcoal/50 text-center py-12">No teachers match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                className={`w-8 h-8 text-sm rounded-sm cursor-pointer ${
                  p === page ? 'bg-teal text-charcoal font-medium' : 'text-charcoal/50 hover:bg-cream-dark'
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
    </div>
  )
}
