import { useState, useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchBookings } from '../../services/bookings'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { PageHeader } from '../../components/shell/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'

const PAGE_SIZE = 5

export function AdminBookingsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data: bookings, loading, refetch } = useAsyncData(() => fetchBookings())

  useLiveDataRefresh(() => void refetch(true), ['bookings'])

  const filtered = useMemo(() => {
    if (!search) return bookings ?? []
    const q = search.toLowerCase()
    return (bookings ?? []).filter(
      (b) => b.studentName.toLowerCase().includes(q) || b.teacherName.toLowerCase().includes(q),
    )
  }, [bookings, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Review active and historical bookings." />

      {loading ? (
        <TeacherTableSkeleton rows={5} />
      ) : (
        <>
          <AdminTable
            headers={['Student', 'Teacher', 'Start Date', 'Monthly Fee', 'Status', 'Payment', 'Actions']}
            searchPlaceholder="Search bookings..."
            onSearch={setSearch}
          >
            {paginated.map((b) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{b.studentName}</td>
                <td className="px-4 py-3">{b.teacherName}</td>
                <td className="px-4 py-3">{b.startDate}</td>
                <td className="px-4 py-3">₹{b.monthlyFee.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3"><Badge>{b.status}</Badge></td>
                <td className="px-4 py-3">
                  <Badge variant={b.paymentStatus === 'Paid' ? 'verified' : 'primary'}>{b.paymentStatus}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="ghost">View Details</Button>
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
