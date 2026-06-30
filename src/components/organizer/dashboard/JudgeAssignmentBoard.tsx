import { useMemo, useState } from 'react'
import { AlertTriangle, GripVertical, Search } from 'lucide-react'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchTeachers } from '../../../services/teachers'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'
import { Select } from '../../ui/Select'
import { EmptyState } from '../../shell/EmptyState'
import type { OrganizerJudgeSummary } from '../../../services/organizerDashboard'
import {
  assignJudgeToCompetition,
  lockCompetitionCategory,
  updateJudgeCategory,
} from '../../../services/organizerOperations'

interface JudgeAssignmentBoardProps {
  competitionId: string
  summary: OrganizerJudgeSummary
  organizerId: string
  onUpdated: () => void
}

export function JudgeAssignmentBoard({
  competitionId,
  summary,
  organizerId,
  onUpdated,
}: JudgeAssignmentBoardProps) {
  const [search, setSearch] = useState('')
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [draggingJudgeId, setDraggingJudgeId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const { data: teachersData, loading: teachersLoading } = useAsyncData(
    () => fetchTeachers(true),
    [],
  )
  const teachers = teachersData ?? []

  const assignedJudgeUserIds = useMemo(
    () => new Set(summary.judges.map((j) => j.userId)),
    [summary.judges],
  )

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return teachers
      .filter((teacher) => !assignedJudgeUserIds.has(teacher.id))
      .filter((teacher) => {
        if (!query) return true
        return (
          teacher.name.toLowerCase().includes(query) ||
          teacher.email.toLowerCase().includes(query) ||
          teacher.city.toLowerCase().includes(query)
        )
      })
  }, [teachers, search, assignedJudgeUserIds])

  async function handleAssign(categoryId: string | null) {
    if (!draggingJudgeId) return
    setBusy(true)
    try {
      await updateJudgeCategory(draggingJudgeId, categoryId)
      setDraggingJudgeId(null)
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  async function handleInviteJudge() {
    if (!selectedTeacherId.trim()) return
    setBusy(true)
    try {
      await assignJudgeToCompetition(
        competitionId,
        selectedTeacherId.trim(),
        organizerId,
        selectedCategoryId || null,
      )
      setSelectedTeacherId('')
      setSelectedCategoryId('')
      setSearch('')
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  async function handleLockCategory(categoryId: string) {
    setBusy(true)
    try {
      await lockCompetitionCategory(competitionId, categoryId)
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardCard
      title="Judge assignments"
      description={`${summary.assigned} assigned · ${summary.unassignedCategories} categories open · ${summary.conflicts} conflicts`}
    >
      {summary.conflicts > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            {summary.conflicts} scheduling conflict{summary.conflicts === 1 ? '' : 's'} detected.
            Review overlapping assignments.
          </p>
        </div>
      )}

      <div className="mb-4 space-y-3 rounded-[12px] border border-border bg-muted/20 p-4">
        <p className="text-sm font-medium text-foreground">Assign a teacher as judge</p>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teacher by name, email, or city…"
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated py-2 pl-10 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </div>
        <Select
          label="Select teacher"
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId(e.target.value)}
          disabled={teachersLoading || busy}
        >
          <option value="">
            {teachersLoading ? 'Loading teachers…' : 'Choose a teacher…'}
          </option>
          {filteredTeachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>
              {teacher.name}
              {teacher.city ? ` · ${teacher.city}` : ''}
            </option>
          ))}
        </Select>
        {summary.categories.length > 0 && (
          <Select
            label="Assign to category (optional)"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            disabled={busy}
          >
            <option value="">Unassigned — assign later</option>
            {summary.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        )}
        <Button
          onClick={() => void handleInviteJudge()}
          disabled={busy || !selectedTeacherId.trim()}
          className="w-full sm:w-auto"
        >
          Assign judge
        </Button>
        {!teachersLoading && filteredTeachers.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No matching teachers found. All verified teachers may already be assigned.
          </p>
        )}
      </div>

      {summary.categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Add categories in the creation wizard to assign judges."
          className="py-6"
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {summary.categories.map((category) => {
            const categoryJudges = summary.judges.filter((j) => j.categoryId === category.id)
            return (
              <div
                key={category.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => void handleAssign(category.id)}
                className="rounded-[12px] border border-dashed border-border bg-muted/30 p-3 min-h-[100px]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-foreground">{category.name}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void handleLockCategory(category.id)}
                  >
                    Lock category
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-2">Assigned judges</p>
                <ul className="space-y-1">
                  {categoryJudges.length === 0 && (
                    <li className="text-xs text-muted-foreground">No judges assigned yet</li>
                  )}
                  {categoryJudges.map((judge) => (
                    <li
                      key={judge.id}
                      draggable
                      onDragStart={() => setDraggingJudgeId(judge.id)}
                      className="flex items-center gap-2 rounded-[12px] bg-elevated border border-border px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical size={14} className="text-muted-foreground" aria-hidden />
                      {judge.userName ?? judge.userId.slice(0, 8)}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {summary.judges.filter((j) => !j.categoryId).length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Unassigned judges
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.judges
              .filter((j) => !j.categoryId)
              .map((judge) => (
                <div
                  key={judge.id}
                  draggable
                  onDragStart={() => setDraggingJudgeId(judge.id)}
                  className="flex items-center gap-2 rounded-full border border-border bg-elevated px-3 py-1 text-sm cursor-grab"
                >
                  <GripVertical size={14} aria-hidden />
                  {judge.userName ?? 'Judge'}
                </div>
              ))}
          </div>
        </div>
      )}

      {summary.categories.length > 0 && draggingJudgeId && (
        <div className="mt-4 lg:hidden">
          <Select
            label="Move dragged judge to category"
            value=""
            onChange={(e) => {
              if (draggingJudgeId && e.target.value) {
                void handleAssign(e.target.value)
              }
            }}
          >
            <option value="">Select category…</option>
            {summary.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </DashboardCard>
  )
}
