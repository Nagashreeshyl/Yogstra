import { useState, useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchStudents } from '../../services/students'
import { fetchAllTeachersAdmin } from '../../services/teachers'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'

const PAGE_SIZE = 5

export function AdminStudentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data: students, loading } = useAsyncData(() => fetchStudents())
  const { data: teachers } = useAsyncData(() => fetchAllTeachersAdmin())

  const filtered = useMemo(() => {
    if (!search) return students ?? []
    const q = search.toLowerCase()
    return (students ?? []).filter((s) => s.name.toLowerCase().includes(q))
  }, [students, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getTeacherName = (id?: string) => (teachers ?? []).find((t) => t.id === id)?.name || '—'

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Students</h1>

      {loading ? (
        <p className="text-charcoal/50">Loading students...</p>
      ) : (
        <>
          <AdminTable
            headers={['Name', 'Email', 'Phone', 'Joined', 'Active Teacher', 'Sessions', 'Actions']}
            searchPlaceholder="Search students..."
            onSearch={setSearch}
          >
            {paginated.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-charcoal/70">{s.email || '—'}</td>
                <td className="px-4 py-3 text-charcoal/70">{s.phone}</td>
                <td className="px-4 py-3">{s.joinedDate}</td>
                <td className="px-4 py-3">{getTeacherName(s.activeTeacherId)}</td>
                <td className="px-4 py-3">{s.totalSessions}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost">View Profile</Button>
                    <Button size="sm" variant="ghost">Bookings</Button>
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
