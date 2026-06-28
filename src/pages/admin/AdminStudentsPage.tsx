import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchStudents } from '../../services/students'
import { fetchAllTeachersAdmin } from '../../services/teachers'
import { fetchBookingsByStudent } from '../../services/bookings'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'

const PAGE_SIZE = 5

export function AdminStudentsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [bookingsStudent, setBookingsStudent] = useState<{ id: string; name: string } | null>(null)
  const { data: students, loading, refetch: refetchStudents } = useAsyncData(() => fetchStudents())
  const { data: teachers, refetch: refetchTeachers } = useAsyncData(() => fetchAllTeachersAdmin())
  const bookingsStudentId = bookingsStudent?.id ?? null
  const { data: studentBookings, loading: bookingsLoading, refetch: refetchStudentBookings } = useAsyncData(
    () => (bookingsStudentId ? fetchBookingsByStudent(bookingsStudentId) : Promise.resolve([])),
    [bookingsStudentId],
  )

  const refreshAll = useCallback(() => {
    void refetchStudents(true)
    void refetchTeachers(true)
    if (bookingsStudentId) void refetchStudentBookings(true)
  }, [refetchStudents, refetchTeachers, refetchStudentBookings, bookingsStudentId])

  useLiveDataRefresh(refreshAll, ['bookings', 'teachers'])

  const filtered = useMemo(() => {
    if (!search) return students ?? []
    const q = search.toLowerCase()
    return (students ?? []).filter((s) => s.name.toLowerCase().includes(q))
  }, [students, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getTeacherName = (id?: string) => (teachers ?? []).find((t) => t.id === id)?.name || '—'

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Students</h1>

      {loading ? (
        <TeacherTableSkeleton rows={5} />
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
                  <div className="flex flex-wrap gap-1">
                    <Link to={`/students/${s.id}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost">View Profile</Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setBookingsStudent({ id: s.id, name: s.name })}
                    >
                      Bookings
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>

          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={!!bookingsStudent}
        onClose={() => setBookingsStudent(null)}
        className="max-w-lg"
      >
        <h2 className="font-heading text-lg font-medium mb-1">Bookings</h2>
        <p className="text-sm text-charcoal/50 mb-4">{bookingsStudent?.name}</p>

        {bookingsLoading ? (
          <TeacherTableSkeleton rows={3} />
        ) : (studentBookings ?? []).length === 0 ? (
          <p className="text-sm text-charcoal/50">No bookings for this student.</p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {(studentBookings ?? []).map((b) => (
              <div key={b.id} className="border border-border rounded-sm p-3 bg-cream">
                <p className="text-sm font-medium">{b.teacherName}</p>
                <p className="text-xs text-charcoal/50 mt-1">
                  Started {b.startDate} · ₹{b.monthlyFee.toLocaleString('en-IN')}/mo
                </p>
                <div className="flex gap-2 mt-2">
                  <Badge>{b.status}</Badge>
                  <Badge variant={b.paymentStatus === 'Paid' ? 'verified' : 'teal'}>{b.paymentStatus}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
