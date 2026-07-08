import { useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { createBatch, enrollStudentInBatch, fetchAcademyBatches } from '../../services/batchService'
import { fetchAcademyTeachers } from '../../services/academyMemberService'
import { fetchStudentList } from '../../services/students'
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
import { CustomSelect } from '../../components/ui/CustomSelect'
import { SearchablePersonSelect } from '../../components/ui/SearchablePersonSelect'
import { SearchableSelect } from '../../components/ui/SearchablePersonSelect'

const DIFFICULTY_OPTIONS = [
  { id: '', label: 'Any' },
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

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

  const { data: academyTeachers, loading: teachersLoading } = useAsyncData(
    () => (academyId ? fetchAcademyTeachers(academyId) : Promise.resolve([])),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  const { data: students, loading: studentsLoading } = useAsyncData(() => fetchStudentList(), [])

  const teacherOptions = useMemo(
    () =>
      (academyTeachers ?? [])
        .filter((t) => t.status === 'active' || t.status === 'invited')
        .map((t) => ({
          id: t.teacherId,
          label: t.teacherName ?? 'Teacher',
          hint: t.employmentType.replace('_', ' '),
        })),
    [academyTeachers],
  )

  const studentOptions = useMemo(
    () =>
      (students ?? []).map((s) => ({
        id: s.id,
        label: s.name,
        hint: s.phone || undefined,
      })),
    [students],
  )

  const batchOptions = useMemo(
    () =>
      (batches ?? []).map((batch) => ({
        id: batch.id,
        label: batch.name,
        hint: batch.difficulty ?? undefined,
      })),
    [batches],
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

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="overflow-visible rounded-[16px] border border-border bg-elevated p-5 space-y-4"
        >
          <h2 className="font-heading text-lg font-semibold">Create batch</h2>
          <Input label="Batch name" value={name} onChange={(e) => setName(e.target.value)} required />
          <SearchablePersonSelect
            id="create-batch-teacher"
            label="Teacher (optional)"
            value={teacherId}
            onChange={setTeacherId}
            options={teacherOptions}
            loading={teachersLoading}
            disabled={creating}
            selectPlaceholder="Choose a teacher…"
            searchPlaceholder="Search academy teachers…"
            emptyMessage="No teachers match your search."
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="Capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
            <CustomSelect
              id="create-batch-difficulty"
              label="Difficulty"
              value={difficulty}
              onChange={(next) => setDifficulty(next as BatchDifficulty | '')}
              options={DIFFICULTY_OPTIONS}
              placeholder="Any"
            />
          </div>
          {createError && <p className="text-sm text-red-600">{createError}</p>}
          <Button type="submit" disabled={creating || !name.trim()}>
            {creating ? 'Creating…' : 'Create batch'}
          </Button>
        </form>

        <form
          onSubmit={(e) => void handleEnroll(e)}
          className="overflow-visible rounded-[16px] border border-border bg-elevated p-5 space-y-4"
        >
          <h2 className="font-heading text-lg font-semibold">Enroll student</h2>
          <SearchableSelect
            id="enroll-student-batch"
            label="Batch"
            value={enrollBatchId}
            onChange={setEnrollBatchId}
            options={batchOptions}
            loading={loading}
            disabled={enrolling}
            required
            enableSearch={batchOptions.length > 6}
            selectPlaceholder="Select batch…"
            searchPlaceholder="Search batches…"
            emptyMessage="No batches match your search."
          />
          <SearchablePersonSelect
            id="enroll-student-person"
            label="Student"
            value={enrollStudentId}
            onChange={setEnrollStudentId}
            options={studentOptions}
            loading={studentsLoading}
            disabled={enrolling}
            required
            selectPlaceholder="Choose a student…"
            searchPlaceholder="Search students by name or phone…"
            emptyMessage="No students match your search."
          />
          {enrollError && <p className="text-sm text-red-600">{enrollError}</p>}
          {enrollSuccess && <p className="text-sm text-primary">{enrollSuccess}</p>}
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
                <Badge variant={batch.status === 'active' ? 'primary' : 'default'}>{batch.status}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(batch.updatedAt).toLocaleDateString('en-IN')}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </PageContainer>
  )
}
