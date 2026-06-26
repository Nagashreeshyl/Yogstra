import { useState, useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAllTeachersAdmin, updateTeacherStatus } from '../../services/teachers'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

const PAGE_SIZE = 5

export function AdminTeachersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const { data: teachers, loading, refetch } = useAsyncData(() => fetchAllTeachersAdmin())

  const filtered = useMemo(() => {
    return (teachers ?? []).filter((t) => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || t.status.toLowerCase() === statusFilter.toLowerCase()
      return matchSearch && matchStatus
    })
  }, [teachers, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleStatus = async (id: string, status: 'verified' | 'rejected') => {
    await updateTeacherStatus(id, status)
    await refetch()
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Teachers</h1>

      {loading ? (
        <p className="text-charcoal/50">Loading teachers...</p>
      ) : (
        <>
          <AdminTable
            headers={['Name', 'Email', 'Phone', 'Specialization', 'City', 'Status', 'Registered', 'Actions']}
            searchPlaceholder="Search teachers..."
            filterOptions={[
              { label: 'Pending', value: 'Pending' },
              { label: 'Verified', value: 'Verified' },
              { label: 'Rejected', value: 'Rejected' },
            ]}
            onSearch={setSearch}
            onFilter={setStatusFilter}
          >
            {paginated.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-charcoal/70">{t.email || '—'}</td>
                <td className="px-4 py-3 text-charcoal/70">{t.phone}</td>
                <td className="px-4 py-3">{t.specializations.join(', ')}</td>
                <td className="px-4 py-3">{t.city}</td>
                <td className="px-4 py-3">
                  <Badge variant={t.status === 'Verified' ? 'verified' : t.status === 'Pending' ? 'teal' : 'default'}>
                    {t.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{t.registeredDate}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.status === 'Pending' && (
                      <>
                        <Button size="sm" onClick={() => handleStatus(t.id, 'verified')}>Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => handleStatus(t.id, 'rejected')}>Reject</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>

          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
