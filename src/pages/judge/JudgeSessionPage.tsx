import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useJudgeOfflineSync } from '../../hooks/useJudgeOfflineSync'
import { fetchJudgeSession } from '../../services/judgeDashboard'
import { getScoringCriteriaFromSettings } from '../../utils/judgeScoringCriteria'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'
import { ParticipantQueue } from '../../components/judge/ParticipantQueue'
import { ScoreCard } from '../../components/judge/ScoreCard'
import { ReviewPanel } from '../../components/judge/ReviewPanel'
import { OfflineIndicator } from '../../components/judge/OfflineIndicator'
import { formatTime } from '../../utils/format'

type Tab = 'queue' | 'review'

export function JudgeSessionPage() {
  const { competitionId = '', categoryId = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('queue')

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && competitionId && categoryId
        ? fetchJudgeSession(userId, competitionId, categoryId)
        : Promise.reject(new Error('Invalid session')),
    [userId, competitionId, categoryId],
    { enabled: Boolean(userId && competitionId && categoryId) },
  )

  const { status: syncStatus, pendingCount } = useJudgeOfflineSync(() => void refetch())

  if (loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return (
      <ErrorState
        title="Session unavailable"
        message={error ?? 'You may not be assigned to this category.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const { session, participants, scores, scoreByParticipant } = data
  const criteria = getScoringCriteriaFromSettings(session.competition.settings)
  const participantNames = new Map(participants.map((p) => [p.id, p.displayName]))
  const activeParticipant = participants.find((p) => p.id === activeParticipantId) ?? null
  const activeScore = activeParticipantId ? scoreByParticipant.get(activeParticipantId) ?? null : null

  return (
    <div className="judge-portal py-4 sm:py-6" data-high-contrast="true">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          to="/dashboard/judge"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline min-h-[44px] touch-manipulation"
        >
          <ArrowLeft size={16} aria-hidden />
          Judge portal
        </Link>
        <OfflineIndicator status={syncStatus} pendingCount={pendingCount} />
      </div>

      <DashboardCard
        title={session.competition.name}
        description={session.category?.name ?? 'Category'}
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
          <div>
            <dt className="text-muted-foreground text-xs">Stage</dt>
            <dd className="font-medium">{session.event?.stage ?? 'Main'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Session</dt>
            <dd className="font-medium">
              {session.event ? formatTime(session.event.startsAt) : 'TBD'}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Participants</dt>
            <dd className="font-medium">{session.participantCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Status</dt>
            <dd className="font-medium">{session.statusLabel}</dd>
          </div>
        </dl>
      </DashboardCard>

      <div className="mt-6 flex gap-2 border-b border-border mb-4">
        {(['queue', 'review'] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`px-4 py-3 text-sm font-medium capitalize min-h-[48px] touch-manipulation border-b-2 -mb-px ${
              tab === item
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            {item === 'queue' ? 'Participant order' : 'Review scores'}
          </button>
        ))}
      </div>

      {tab === 'queue' ? (
        <ParticipantQueue
          participants={participants}
          scoreByParticipant={scoreByParticipant}
          activeParticipantId={activeParticipantId}
          onSelect={(id) => setActiveParticipantId(id)}
        />
      ) : (
        <ReviewPanel
          scores={scores}
          criteria={criteria}
          participantNames={participantNames}
          isLocked={session.isLocked}
        />
      )}

      {activeParticipant && (
        <ScoreCard
          userId={userId}
          competitionId={competitionId}
          categoryId={categoryId}
          participant={activeParticipant}
          criteria={criteria}
          existingScore={activeScore}
          isLocked={session.isLocked}
          eventId={session.event?.id}
          onSubmitted={() => {
            void refetch()
          }}
          onBack={() => setActiveParticipantId(null)}
        />
      )}
    </div>
  )
}
