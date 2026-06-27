import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAppIntervalRefresh } from '../../hooks/useIntervalRefresh'
import { fetchAllTeachersAdmin, removeTeacher, updateTeacherStatus } from '../../services/teachers'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'

const PAGE_SIZE = 5

export function AdminTeachersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [removing, setRemoving] = useState(false)
  const { data: teachers, loading, refetch } = useAsyncData(() => fetchAllTeachersAdmin())

  useAppIntervalRefresh(() => {
    void refetch(true)
  })

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

  const handleRemove = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await removeTeacher(removeTarget.id)
      setRemoveTarget(null)
      await refetch()
    } finally {
      setRemoving(false)
    }
  }

  const statusVariant = (status: string) => {
    if (status === 'Verified') return 'verified'
    if (status === 'Pending') return 'teal'
    if (status === 'Removed') return 'default'
    return 'default'
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Teachers</h1>

      {loading ? (
        <TeacherTableSkeleton rows={5} />
      ) : (
        <>
          <AdminTable
            headers={['Name', 'Email', 'Phone', 'Specialization', 'City', 'Status', 'Registered', 'Actions']}
            searchPlaceholder="Search teachers..."
            filterOptions={[
              { label: 'Pending', value: 'Pending' },
              { label: 'Verified', value: 'Verified' },
              { label: 'Rejected', value: 'Rejected' },
              { label: 'Removed', value: 'Removed' },
            ]}
            onSearch={setSearch}
            onFilter={setStatusFilter}
          >
            {paginated.map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 text-charcoal/70">{t.email || '—'}</td>
                <td className="px-4 py-3 text-charcoal/70">{t.phone}</td>
                <td className="px-4 py-3">{t.specializations.join(', ') || '—'}</td>
                <td className="px-4 py-3">{t.city}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                </td>
                <td className="px-4 py-3 text-charcoal/70">{t.registeredDate}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Link to={`/teachers/${t.id}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost">View Profile</Button>
                    </Link>
                    {t.status === 'Pending' && (
                      <>
                        <Button size="sm" onClick={() => void handleStatus(t.id, 'verified')}>Approve</Button>
                        <Button size="sm" variant="secondary" onClick={() => void handleStatus(t.id, 'rejected')}>Reject</Button>
                      </>
                    )}
                    {t.status !== 'Removed' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRemoveTarget({ id: t.id, name: t.name })}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>

          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} className="max-w-sm">
        <h2 className="font-heading text-lg font-medium mb-3">Remove Teacher</h2>
        <p className="text-sm text-charcoal/70 mb-6 leading-relaxed">
          Remove <strong>{removeTarget?.name}</strong>? They will lose dashboard access, active bookings
          will be cancelled, and they must request verification again to rejoin.
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" className="flex-1" disabled={removing} onClick={() => void handleRemove()}>
            {removing ? 'Removing...' : 'Remove Teacher'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
