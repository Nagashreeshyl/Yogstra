import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAllAcademies } from '../../services/academyService'
import { adminUpdateAcademyStatus } from '../../services/academyOperations'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { InstructionPanel } from '../../components/ui/InstructionPanel'
import type { AcademyStatus } from '../../domain/academy/models'

const PAGE_SIZE = 10

function statusVariant(status: string) {
  if (status === 'active') return 'verified'
  if (status === 'inactive') return 'primary'
  return 'default'
}

export function AdminAcademiesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const { data: academies, loading, error, refetch } = useAsyncData(() => fetchAllAcademies())

  const filtered = (academies ?? []).filter((a) => {
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.city?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchStatus = !statusFilter || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function setStatus(academyId: string, status: AcademyStatus) {
    setBusyId(academyId)
    try {
      await adminUpdateAcademyStatus(academyId, status)
      await refetch(true)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Academies" description="View, search, and manage registered yoga academies." />

      <InstructionPanel
        storageKey="admin-academies"
        title="Academy management"
        steps={[
          { label: 'Search and filter' },
          { label: 'Suspend inactive academies' },
          { label: 'Archive or restore' },
          { label: 'Review status changes' },
        ]}
      />

      {loading ? (
        <TeacherTableSkeleton rows={6} />
      ) : error ? (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
          Unable to load academies. Please refresh the page.
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No academies found"
          description="Academies appear here when teachers create them from the Academy workspace."
          outcome="Use filters to find archived or inactive academies."
        />
      ) : (
        <>
          <AdminTable
            headers={['Name', 'Slug', 'City', 'State', 'Status', 'Created', 'Actions']}
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
            {paginated.map((a) => (
              <tr key={a.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.slug}</td>
                <td className="px-4 py-3">{a.city ?? '—'}</td>
                <td className="px-4 py-3">{a.state ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(a.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {a.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === a.id}
                          onClick={() => void setStatus(a.id, 'inactive')}
                        >
                          Suspend
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === a.id}
                          onClick={() => void setStatus(a.id, 'archived')}
                        >
                          Archive
                        </Button>
                      </>
                    )}
                    {a.status !== 'active' && (
                      <Button
                        size="sm"
                        disabled={busyId === a.id}
                        onClick={() => void setStatus(a.id, 'active')}
                      >
                        Restore
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
    </div>
  )
}
