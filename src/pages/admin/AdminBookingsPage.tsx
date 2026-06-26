import { useState, useMemo } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchBookings } from '../../services/bookings'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

const PAGE_SIZE = 5

export function AdminBookingsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data: bookings, loading } = useAsyncData(() => fetchBookings())

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
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Bookings</h1>

      {loading ? (
        <p className="text-charcoal/50">Loading bookings...</p>
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
                  <Badge variant={b.paymentStatus === 'Paid' ? 'verified' : 'teal'}>{b.paymentStatus}</Badge>
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
