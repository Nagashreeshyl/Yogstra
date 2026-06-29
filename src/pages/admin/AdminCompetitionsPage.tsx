import { useMemo, useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAllCompetitions } from '../../services/competitionService'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/shell/PageHeader'

const PAGE_SIZE = 10

function statusVariant(status: string) {
  if (status === 'registration_open') return 'verified'
  if (status === 'draft') return 'primary'
  if (status === 'completed') return 'default'
  return 'default'
}

export function AdminCompetitionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const { data: competitions, loading, error } = useAsyncData(() => fetchAllCompetitions())

  const filtered = useMemo(() => {
    return (competitions ?? []).filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.city?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchStatus = !statusFilter || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [competitions, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const statusOptions = useMemo(() => {
    const statuses = [...new Set((competitions ?? []).map((c) => c.status))]
    return statuses.map((s) => ({ label: s.replace(/_/g, ' '), value: s }))
  }, [competitions])

  return (
    <div className="space-y-6">
      <PageHeader title="Competitions" description="Competition registry and status." />

      {loading ? (
        <TeacherTableSkeleton rows={6} />
      ) : error ? (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
          Unable to load competitions. Please refresh the page.
        </p>
      ) : (
        <>
          <AdminTable
            headers={['Name', 'Organizer', 'Location', 'Start', 'Status', 'Scope']}
            searchPlaceholder="Search competitions..."
            filterOptions={statusOptions}
            onSearch={(q) => {
              setSearch(q)
              setPage(1)
            }}
            onFilter={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
          >
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-3 text-sm text-muted-foreground">
                  No competitions found.
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.organizerName ?? '—'}</td>
                  <td className="px-4 py-3">
                    {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">{c.startDate ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(c.status)}>
                      {c.status.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 capitalize">{c.scope}</td>
                </tr>
              ))
            )}
          </AdminTable>

          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
