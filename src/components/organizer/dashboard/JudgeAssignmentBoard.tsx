import { useState } from 'react'
import { AlertTriangle, GripVertical } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Select } from '../../ui/Select'
import { EmptyState } from '../../shell/EmptyState'
import type { OrganizerJudgeSummary } from '../../../services/organizerDashboard'
import {
  assignJudgeToCompetition,
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
  const [userId, setUserId] = useState('')
  const [draggingJudgeId, setDraggingJudgeId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    if (!userId.trim()) return
    setBusy(true)
    try {
      await assignJudgeToCompetition(competitionId, userId.trim(), organizerId)
      setUserId('')
      onUpdated()
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardCard
      title="Judge assignments"
      description={`${summary.assigned} assigned · ${summary.unassignedCategories} categories open · ${summary.conflicts} conflicts`}
      action={
        <Button size="sm" variant="secondary" disabled={busy}>
          Assign judges
        </Button>
      }
    >
      {summary.conflicts > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p>{summary.conflicts} scheduling conflict{summary.conflicts === 1 ? '' : 's'} detected. Review overlapping assignments.</p>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <Input
          label="Invite judge (user ID)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Profile UUID"
          className="flex-1"
        />
        <Button onClick={() => void handleInviteJudge()} disabled={busy || !userId.trim()}>
          Invite
        </Button>
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
                <p className="text-sm font-medium text-foreground">{category.name}</p>
                <p className="text-xs text-muted-foreground mb-2">Drop a judge here</p>
                <ul className="space-y-1">
                  {categoryJudges.map((judge) => (
                    <li
                      key={judge.id}
                      draggable
                      onDragStart={() => setDraggingJudgeId(judge.id)}
                      className="flex items-center gap-2 rounded-sm bg-elevated border border-border px-2 py-1.5 text-sm cursor-grab active:cursor-grabbing"
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

      {summary.categories.length > 0 && (
        <div className="mt-4 sm:hidden">
          <Select
            label="Assign dragged judge to category"
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
