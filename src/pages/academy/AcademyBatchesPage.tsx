import { useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { createBatch, enrollStudentInBatch, fetchAcademyBatches } from '../../services/batchService'
import type { BatchDifficulty } from '../../domain/academy/models'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { AdminTable } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function AcademyBatchesPage() {
  const { academyId, loading: contextLoading, error: contextError, refetch: refetchContext } =
    useAcademyContext()
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [capacity, setCapacity] = useState('')
  const [difficulty, setDifficulty] = useState<BatchDifficulty | ''>('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [enrollBatchId, setEnrollBatchId] = useState('')
  const [enrollStudentId, setEnrollStudentId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null)

  const { data: batches, loading, error, refetch } = useAsyncData(
    () => (academyId ? fetchAcademyBatches(academyId) : Promise.resolve([])),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return (batches ?? []).filter(
      (b) => !q || b.name.toLowerCase().includes(q) || (b.teacherName ?? '').toLowerCase().includes(q),
    )
  }, [batches, search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academyId || !name.trim()) return

    setCreating(true)
    setCreateError(null)

    try {
      await createBatch({
        academyId,
        name: name.trim(),
        teacherId: teacherId.trim() || null,
        capacity: capacity ? Number(capacity) : undefined,
        difficulty: difficulty || undefined,
        status: 'active',
      })
      setName('')
      setTeacherId('')
      setCapacity('')
      setDifficulty('')
      await refetch()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create batch.')
    } finally {
      setCreating(false)
    }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollBatchId || !enrollStudentId.trim()) return

    setEnrolling(true)
    setEnrollError(null)
    setEnrollSuccess(null)

    try {
      await enrollStudentInBatch({
        batchId: enrollBatchId,
        studentId: enrollStudentId.trim(),
      })
      setEnrollSuccess('Student enrolled successfully.')
      setEnrollStudentId('')
      await refetch()
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Could not enroll student.')
    } finally {
      setEnrolling(false)
    }
  }

  if (contextLoading || (loading && !batches)) {
    return <LoadingSkeleton />
  }

  if (contextError || !academyId) {
    return (
      <PageContainer width="wide">
        <ErrorState
          message={contextError ?? 'No academy selected.'}
          onRetry={() => void refetchContext()}
        />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer width="wide">
        <ErrorState message={error} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      <PageHeader title="Batches" description="Create and manage training batches." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="rounded-[16px] border border-border bg-elevated p-5 space-y-4"
        >
          <h2 className="font-heading text-lg font-semibold">Create batch</h2>
          <Input label="Batch name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Teacher ID (optional)"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            placeholder="UUID"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="difficulty" className="text-sm font-medium text-charcoal">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as BatchDifficulty | '')}
                className="w-full px-4 py-2.5 text-sm bg-cream border border-border rounded-sm focus:outline-none focus:border-teal"
              >
                <option value="">Any</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? 'Creating…' : 'Create batch'}
          </Button>
        </form>

        <form
          onSubmit={(e) => void handleEnroll(e)}
          className="rounded-[16px] border border-border bg-elevated p-5 space-y-4"
        >
          <h2 className="font-heading text-lg font-semibold">Enroll student</h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="enroll-batch" className="text-sm font-medium text-charcoal">
              Batch
            </label>
            <select
              id="enroll-batch"
              value={enrollBatchId}
              onChange={(e) => setEnrollBatchId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-cream border border-border rounded-sm focus:outline-none focus:border-teal"
              required
            >
              <option value="">Select batch</option>
              {(batches ?? []).map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Student ID"
            value={enrollStudentId}
            onChange={(e) => setEnrollStudentId(e.target.value)}
            placeholder="Student UUID"
            required
          />
          {enrollError && <p className="text-sm text-red-600">{enrollError}</p>}
          {enrollSuccess && <p className="text-sm text-teal">{enrollSuccess}</p>}
          <Button type="submit" disabled={enrolling || !enrollBatchId || !enrollStudentId.trim()}>
            {enrolling ? 'Enrolling…' : 'Enroll student'}
          </Button>
        </form>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Layers size={24} />}
          title="No batches yet"
          description="Create your first batch to organize students and assign teachers."
        />
      ) : (
        <AdminTable
          headers={['Name', 'Teacher', 'Difficulty', 'Capacity', 'Status', 'Updated']}
          searchPlaceholder="Search batches..."
          onSearch={setSearch}
        >
          {filtered.map((batch) => (
            <tr key={batch.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{batch.name}</td>
              <td className="px-4 py-3">{batch.teacherName ?? '—'}</td>
              <td className="px-4 py-3 capitalize">{batch.difficulty ?? '—'}</td>
              <td className="px-4 py-3">{batch.capacity ?? '—'}</td>
              <td className="px-4 py-3">
                <Badge variant={batch.status === 'active' ? 'teal' : 'default'}>{batch.status}</Badge>
              </td>
              <td className="px-4 py-3 text-charcoal/70">
                {new Date(batch.updatedAt).toLocaleDateString('en-IN')}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </PageContainer>
  )
}
