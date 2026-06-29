import { useMemo, useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAllCompetitions } from '../../services/competitionService'
import { archiveCompetition, updateCompetitionStatus } from '../../services/organizerOperations'
import { AdminTable, AdminPagination } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { InstructionPanel } from '../../components/ui/InstructionPanel'
import { formatCompetitionStatus } from '../../domain/competition/permissions'
import type { CompetitionStatus } from '../../domain/competition/models'

const PAGE_SIZE = 10

export function AdminCompetitionsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState<string | null>(null)
  const { data: competitions, loading, error, refetch } = useAsyncData(() => fetchAllCompetitions())

  const filtered = useMemo(() => {
    return (competitions ?? []).filter((c) => {
      const matchSearch =
        !search || c.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || c.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [competitions, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  async function setStatus(competitionId: string, status: CompetitionStatus) {
    setBusyId(competitionId)
    try {
      await updateCompetitionStatus(competitionId, status)
      await refetch(true)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Competitions" description="Monitor draft, live, and completed competitions platform-wide." />

      <InstructionPanel
        storageKey="admin-competitions"
        title="Competition oversight"
        steps={[
          { label: 'Filter by status' },
          { label: 'Review live events' },
          { label: 'Archive completed competitions' },
        ]}
      />

      {loading ? (
        <TeacherTableSkeleton rows={6} />
      ) : error ? (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
          Unable to load competitions. Please refresh the page.
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No competitions found"
          description="Competitions appear when teachers create them from the Competition workspace."
          outcome="Try clearing filters to see archived or draft events."
        />
      ) : (
        <>
          <AdminTable
            headers={['Name', 'Location', 'Start', 'Status', 'Scope', 'Actions']}
            searchPlaceholder="Search competitions..."
            filterOptions={[
              { label: 'Draft', value: 'draft' },
              { label: 'Registration open', value: 'registration_open' },
              { label: 'Live', value: 'in_progress' },
              { label: 'Completed', value: 'completed' },
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
            {paginated.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="primary">{formatCompetitionStatus(c.status)}</Badge>
                </td>
                <td className="px-4 py-3">{c.scope}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {c.status !== 'archived' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === c.id}
                        onClick={() => void archiveCompetition(c.id).then(() => refetch(true))}
                      >
                        Archive
                      </Button>
                    )}
                    {c.status === 'archived' && (
                      <Button
                        size="sm"
                        disabled={busyId === c.id}
                        onClick={() => void setStatus(c.id, 'completed')}
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
