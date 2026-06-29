import { Link } from 'react-router-dom'
import { Calendar, ClipboardList, Megaphone, Scale } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useJudgeOfflineSync } from '../../hooks/useJudgeOfflineSync'
import { fetchJudgeDashboard, getJudgeGreeting } from '../../services/judgeDashboard'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'
import { QuickStats } from '../../components/student/dashboard/StatCard'
import { JudgeAssignmentCard } from '../../components/judge/JudgeAssignmentCard'
import { OfflineIndicator } from '../../components/judge/OfflineIndicator'
import { formatTime } from '../../utils/format'

export function JudgeDashboardPage() {
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? fetchJudgeDashboard(userId)
        : Promise.reject(new Error('Not signed in')),
    [userId],
    { enabled: Boolean(userId) },
  )

  const { status: syncStatus, pendingCount } = useJudgeOfflineSync(() => void refetch())

  if (!user || loading) {
    return <LoadingSkeleton variant="page" />
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Could not load judge portal"
        message={error ?? 'Please try again.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const stats = [
    {
      label: "Today's sessions",
      value: String(data.todayAssignments.length),
      icon: Calendar,
      hint: 'Assignments scheduled today',
    },
    {
      label: 'Categories',
      value: String(data.assignments.filter((a) => a.category).length),
      icon: Scale,
      hint: 'Assigned categories',
    },
    {
      label: 'Scored',
      value: String(data.recentScores.length),
      icon: ClipboardList,
      hint: 'Recent submissions',
    },
    {
      label: 'Updates',
      value: String(data.announcements.length),
      icon: Megaphone,
      hint: 'Organizer announcements',
    },
  ]

  return (
    <div className="judge-portal py-4 sm:py-6" data-high-contrast="true">
      <PageHeader
        title="Judge Portal"
        description="Score participants during live competitions."
        actions={<OfflineIndicator status={syncStatus} pendingCount={pendingCount} />}
      />

      <section className="mb-6">
        <h1 className="font-heading text-2xl font-semibold">{getJudgeGreeting(user.name)}</h1>
        <p className="text-sm text-muted-foreground mt-1">Your assignments and scoring tools</p>
      </section>

      <div className="mb-6 lg:mb-8">
        <QuickStats stats={stats} />
      </div>

      {data.assignments.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="When an organizer assigns you to a competition category, it will appear here."
          className="mt-8"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="lg:col-span-2">
            <DashboardCard title="Today's assignments" description="Sessions happening today.">
              {data.todayAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No sessions scheduled for today.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.todayAssignments.map((item) => (
                    <JudgeAssignmentCard key={item.assignment.id} assignment={item} />
                  ))}
                </div>
              )}
            </DashboardCard>
          </div>

          <DashboardCard title="Upcoming categories" description="Prepare for upcoming sessions.">
            {data.upcomingCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming categories.</p>
            ) : (
              <ul className="space-y-2">
                {data.upcomingCategories.map((item) =>
                  item.category ? (
                    <li key={item.assignment.id}>
                      <Link
                        to={`/dashboard/judge/session/${item.competition.id}/${item.category.id}`}
                        className="flex items-center justify-between rounded-[12px] border border-border px-4 py-3 min-h-[48px] hover:bg-muted/30 touch-manipulation"
                      >
                        <span>
                          <span className="block font-medium">{item.competition.name}</span>
                          <span className="text-sm text-muted-foreground">{item.category.name}</span>
                        </span>
                        <span className="text-xs text-primary font-medium">Open →</span>
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard title="Competition timeline" description="Upcoming events across assignments.">
            {data.timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              <ul className="space-y-2">
                {data.timeline.map((event) => (
                  <li
                    key={event.id}
                    className="flex justify-between gap-2 rounded-[12px] border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{event.name}</span>
                    <span className="text-muted-foreground shrink-0">
                      {formatTime(event.startsAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard title="Announcements" description="Updates from organizers.">
            {data.announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements.</p>
            ) : (
              <ul className="space-y-3">
                {data.announcements.map((item) => (
                  <li key={item.id} className="border-b border-border/60 pb-3 last:border-0">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard title="Recent activity" description="Your latest score submissions.">
            {data.recentScores.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scores submitted yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentScores.map((score) => (
                  <li
                    key={score.id}
                    className="flex justify-between text-sm rounded-[12px] bg-muted/20 px-3 py-2"
                  >
                    <span className="capitalize">{score.status}</span>
                    <span className="font-semibold">{score.totalScore}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>

          <DashboardCard title="Quick actions" description="Jump into scoring.">
            {data.todayAssignments[0]?.category ? (
              <Link
                to={`/dashboard/judge/session/${data.todayAssignments[0].competition.id}/${data.todayAssignments[0].category!.id}`}
                className="inline-flex w-full items-center justify-center rounded-[12px] bg-primary text-primary-foreground py-3 px-4 font-medium min-h-[48px] touch-manipulation"
              >
                Start today&apos;s first session
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">No live sessions right now.</p>
            )}
          </DashboardCard>
        </div>
      )}
    </div>
  )
}
