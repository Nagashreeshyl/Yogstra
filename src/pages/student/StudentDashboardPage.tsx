import { CalendarClock, Flame, Percent, Trophy } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchStudentDashboard } from '../../services/studentDashboard'
import { PageContainer } from '../../components/shell/PageContainer'
import { DashboardWorkspaceHeader } from '../../components/shell/DashboardWorkspaceHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { QuickStats } from '../../components/student/dashboard/StatCard'
import { TodaysPracticeCard } from '../../components/student/dashboard/TodaysPracticeCard'
import { NextClassCard } from '../../components/student/dashboard/NextClassCard'
import { DashboardCompetitionWidget } from '../../components/student/dashboard/DashboardCompetitionWidget'
import { ProgressCard } from '../../components/student/dashboard/ProgressCard'
import { CoachFeedbackCard } from '../../components/student/dashboard/CoachFeedbackCard'
import { AchievementsCard } from '../../components/student/dashboard/AchievementsCard'
import { NotificationsCard } from '../../components/student/dashboard/NotificationsCard'
import { QuickActions } from '../../components/student/dashboard/QuickActions'
import { StudentDashboardSkeleton } from '../../components/student/dashboard/StudentDashboardSkeleton'
import { formatTime } from '../../utils/format'

function formatCountdownShort(scheduledAt: string): string {
  const diffMs = new Date(scheduledAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Now'
  const hours = Math.floor(diffMs / 3_600_000)
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000)
  if (hours >= 24) return `${Math.floor(hours / 24)}d`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function StudentDashboardPage() {
  const { user } = useApp()
  const studentId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () => (studentId ? fetchStudentDashboard(studentId) : Promise.reject(new Error('Not signed in'))),
    [studentId],
    { enabled: Boolean(studentId) },
  )

  if (!user || loading) {
    return <StudentDashboardSkeleton />
  }

  if (error || !data) {
    return (
      <PageContainer>
        <ErrorState
          title="Could not load your dashboard"
          message={error ?? 'Please try again in a moment.'}
          onRetry={() => void refetch()}
        />
      </PageContainer>
    )
  }

  const stats = [
    {
      label: 'Streak',
      value: `${data.progress.streakWeeks}w`,
      icon: Flame,
      hint: 'Weekly practice streak',
    },
    {
      label: 'Attendance',
      value: data.attendance.percentage === null ? '—' : `${data.attendance.percentage}%`,
      icon: Percent,
      hint: data.attendance.monthLabel,
    },
    {
      label: 'Next class',
      value: data.nextClass ? formatTime(data.nextClass.scheduledAt) : '—',
      icon: CalendarClock,
      hint: data.nextClass ? formatCountdownShort(data.nextClass.scheduledAt) : 'No class scheduled',
    },
    {
      label: 'Competition',
      value: data.competition ? `${data.competition.daysUntil}d` : '—',
      icon: Trophy,
      hint: data.competition?.name ?? 'No upcoming events',
    },
  ]

  return (
    <PageContainer width="wide">
      <DashboardWorkspaceHeader
        workspaceTitle="Student"
        description="Track your programs, classes, competitions, and progress."
        userName={user.name}
      />

      <div className="mb-6 lg:mb-8">
        <QuickStats stats={stats} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <TodaysPracticeCard practice={data.todaysPractice} />
        <NextClassCard nextClass={data.nextClass} />
        <DashboardCompetitionWidget competition={data.competition} />
        <ProgressCard attendance={data.attendance} progress={data.progress} />
        <CoachFeedbackCard feedback={data.coachFeedback} />
        <AchievementsCard />
        <NotificationsCard notifications={data.notifications} />
        <QuickActions coach={data.coach} hasLiveClass={Boolean(data.nextClass?.isLive)} />
      </div>
    </PageContainer>
  )
}
