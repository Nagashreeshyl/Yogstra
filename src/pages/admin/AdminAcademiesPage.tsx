import { useMemo, useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAllAcademies } from '../../services/academyService'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/shell/PageHeader'

const PAGE_SIZE = 10

function statusVariant(status: string) {
  if (status === 'active') return 'verified'
  if (status === 'inactive') return 'primary'
  return 'default'
}

export function AdminAcademiesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const { data: academies, loading, error } = useAsyncData(() => fetchAllAcademies())

  const filtered = useMemo(() => {
    return (academies ?? []).filter((a) => {
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        (a.city?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchStatus = !statusFilter || a.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [academies, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Academies" description="Registered yoga academies." />

      {loading ? (
        <TeacherTableSkeleton rows={6} />
      ) : error ? (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
          Unable to load academies. Please refresh the page.
        </p>
      ) : (
        <>
          <AdminTable
            headers={['Name', 'City', 'State', 'Status', 'Created']}
            searchPlaceholder="Search academies..."
            filterOptions={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Archived', value: 'archived' },
            ]}
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
                <td colSpan={5} className="px-4 py-3 text-sm text-muted-foreground">
                  No academies found.
                </td>
              </tr>
            ) : (
              paginated.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3">{a.city ?? '—'}</td>
                  <td className="px-4 py-3">{a.state ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
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
