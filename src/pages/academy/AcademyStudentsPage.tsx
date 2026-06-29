import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { batchRepository } from '../../repositories/batchRepository'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { AdminTable } from '../../components/admin/AdminTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

type AcademyStudentRow = Awaited<ReturnType<typeof batchRepository.listStudentsByAcademy>>[number]

export function AcademyStudentsPage() {
  const { academyId, loading: contextLoading, error: contextError, refetch: refetchContext } =
    useAcademyContext()
  const [search, setSearch] = useState('')

  const { data: students, loading, error, refetch } = useAsyncData(
    () => (academyId ? batchRepository.listStudentsByAcademy(academyId) : Promise.resolve([])),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  const uniqueStudents = useMemo(() => {
    const map = new Map<string, AcademyStudentRow & { batches: string[] }>()
    for (const row of students ?? []) {
      const existing = map.get(row.studentId)
      const batchName = 'batchName' in row ? (row.batchName as string) : 'Batch'
      if (existing) {
        existing.batches.push(batchName)
        continue
      }
      map.set(row.studentId, { ...row, batches: [batchName] })
    }
    return [...map.values()]
  }, [students])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return uniqueStudents.filter(
      (s) =>
        !q ||
        (s.studentName ?? '').toLowerCase().includes(q) ||
        s.studentId.includes(q) ||
        s.batches.some((b) => b.toLowerCase().includes(q)),
    )
  }, [uniqueStudents, search])

  if (contextLoading || (loading && !students)) {
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
      <PageHeader
        title="Students"
        description="View students enrolled across all academy batches."
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={24} />}
          title="No students enrolled"
          description="Enroll students from the Batches page once you have active training groups."
          action={
            <Link to="/dashboard/academy/batches">
              <Button size="sm">Manage batches</Button>
            </Link>
          }
        />
      ) : (
        <AdminTable
          headers={['Name', 'Batch', 'Status', 'Enrolled', 'Actions']}
          searchPlaceholder="Search students..."
          onSearch={setSearch}
        >
          {filtered.map((student) => (
            <tr key={student.studentId} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{student.studentName ?? 'Student'}</td>
              <td className="px-4 py-3 text-muted-foreground">{student.batches.join(', ')}</td>
              <td className="px-4 py-3">
                <Badge variant={student.status === 'active' ? 'primary' : 'default'}>
                  {student.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(student.enrolledAt).toLocaleDateString('en-IN')}
              </td>
              <td className="px-4 py-3">
                <Link to={`/students/${student.studentId}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="ghost">
                    Profile
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </PageContainer>
  )
}
