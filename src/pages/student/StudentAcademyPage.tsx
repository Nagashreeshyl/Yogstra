import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchJoinableAcademyBatches,
  fetchStudentCoachAcademies,
  joinStudentAcademyBatch,
} from '../../services/studentAcademyService'
import { fetchStudentAcademyAssociation } from '../../services/academyService'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { SearchableSelect } from '../../components/ui/SearchablePersonSelect'
import { formatUserFacingError } from '../../utils/format'

export function StudentAcademyPage() {
  const { user } = useApp()
  const studentId = user?.id ?? ''
  const [selectedBatchByAcademy, setSelectedBatchByAcademy] = useState<Record<string, string>>({})
  const [busyAcademyId, setBusyAcademyId] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null)

  const {
    data: academies,
    loading,
    error,
    refetch,
  } = useAsyncData(
    () => (studentId ? fetchStudentCoachAcademies() : Promise.resolve([])),
    [studentId],
    { enabled: Boolean(studentId) },
  )

  const { data: currentAssociation, refetch: refetchAssociation } = useAsyncData(
    () => (studentId ? fetchStudentAcademyAssociation(studentId) : Promise.resolve({ type: 'unassigned' as const })),
    [studentId],
    { enabled: Boolean(studentId) },
  )

  const groupedAcademies = useMemo(() => {
    const map = new Map<
      string,
      {
        academyId: string
        academyName: string
        academyCity: string | null
        academyState: string | null
        coaches: string[]
        isEnrolled: boolean
      }
    >()

    for (const row of academies ?? []) {
      const existing = map.get(row.academyId)
      if (existing) {
        if (!existing.coaches.includes(row.coachName)) {
          existing.coaches.push(row.coachName)
        }
        existing.isEnrolled = existing.isEnrolled || row.isEnrolled
      } else {
        map.set(row.academyId, {
          academyId: row.academyId,
          academyName: row.academyName,
          academyCity: row.academyCity,
          academyState: row.academyState,
          coaches: [row.coachName],
          isEnrolled: row.isEnrolled,
        })
      }
    }

    return [...map.values()]
  }, [academies])

  async function handleJoin(academyId: string, academyName: string) {
    const batchId = selectedBatchByAcademy[academyId]
    if (!batchId) return

    setBusyAcademyId(academyId)
    setJoinError(null)
    setJoinSuccess(null)

    try {
      await joinStudentAcademyBatch(batchId)
      setJoinSuccess(`You joined ${academyName}.`)
      await refetch()
      await refetchAssociation(true)
    } catch (err) {
      setJoinError(formatUserFacingError(err, 'Could not join academy.'))
    } finally {
      setBusyAcademyId(null)
    }
  }

  if (!user || loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState message={error} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Academies"
        description="Join the academy programs run by your coaches on Yogstra."
      />

      {currentAssociation?.type === 'academy_batch' && (
        <DashboardCard title="Academy enrollment" className="mb-6 border-primary/20 bg-primary/5">
          <p className="text-sm text-muted-foreground">
            You are enrolled in an academy program. Contact your coach if you need to switch batches.
          </p>
        </DashboardCard>
      )}

      {joinSuccess && <p className="mb-4 text-sm text-primary">{joinSuccess}</p>}
      {joinError && <p className="mb-4 text-sm text-destructive">{joinError}</p>}

      {groupedAcademies.length === 0 ? (
        <EmptyState
          icon={<Building2 size={24} />}
          title="No academy programs from your coaches yet"
          description="Academies appear here when you have an active coaching relationship with a teacher who belongs to an academy."
          action={
            <Link to="/dashboard/student/teachers">
              <Button>Find a coach</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groupedAcademies.map((academy) => (
            <AcademyJoinCard
              key={academy.academyId}
              academy={academy}
              selectedBatchId={selectedBatchByAcademy[academy.academyId] ?? ''}
              onBatchChange={(batchId) =>
                setSelectedBatchByAcademy((prev) => ({ ...prev, [academy.academyId]: batchId }))
              }
              onJoin={() => void handleJoin(academy.academyId, academy.academyName)}
              busy={busyAcademyId === academy.academyId}
            />
          ))}
        </div>
      )}
    </PageContainer>
  )
}

function AcademyJoinCard({
  academy,
  selectedBatchId,
  onBatchChange,
  onJoin,
  busy,
}: {
  academy: {
    academyId: string
    academyName: string
    academyCity: string | null
    academyState: string | null
    coaches: string[]
    isEnrolled: boolean
  }
  selectedBatchId: string
  onBatchChange: (batchId: string) => void
  onJoin: () => void
  busy: boolean
}) {
  const { data: batches, loading } = useAsyncData(
    () => fetchJoinableAcademyBatches(academy.academyId),
    [academy.academyId],
  )

  const location = [academy.academyCity, academy.academyState].filter(Boolean).join(', ')

  return (
    <article className="rounded-[16px] border border-border bg-elevated p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground">{academy.academyName}</h2>
          {location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin size={14} aria-hidden />
              {location}
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Coach: {academy.coaches.join(', ')}
          </p>
        </div>
        {academy.isEnrolled && <Badge variant="primary">Joined</Badge>}
      </div>

      {!academy.isEnrolled && (
        <div className="mt-4 space-y-3">
          <SearchableSelect
            id={`join-batch-${academy.academyId}`}
            label="Training batch"
            value={selectedBatchId}
            onChange={onBatchChange}
            options={(batches ?? []).map((batch) => ({
              id: batch.id,
              label: batch.name,
              hint: batch.difficulty ?? undefined,
            }))}
            loading={loading}
            disabled={busy || !(batches?.length ?? 0)}
            enableSearch={(batches?.length ?? 0) > 4}
            selectPlaceholder="Select a batch…"
            searchPlaceholder="Search batches…"
          />
          <Button
            onClick={onJoin}
            disabled={busy || !selectedBatchId || loading}
            className="w-full sm:w-auto"
          >
            {busy ? 'Joining…' : 'Join academy'}
          </Button>
        </div>
      )}
    </article>
  )
}
