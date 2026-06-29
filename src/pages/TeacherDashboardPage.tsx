import { Link } from 'react-router-dom'
import { Calendar, IndianRupee, Star, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchTeacherDashboard } from '../services/teacherDashboard'
import { PageContainer } from '../components/shell/PageContainer'
import { DashboardWorkspaceHeader } from '../components/shell/DashboardWorkspaceHeader'
import { ErrorState } from '../components/shell/ErrorState'
import { TERMS } from '../constants/terminology'
import { QuickStats } from '../components/student/dashboard/StatCard'
import { TodaysClassesCard } from '../components/teacher/dashboard/TodaysClassesCard'
import { AttendanceWidget } from '../components/teacher/dashboard/AttendanceWidget'
import { StudentAlertsCard } from '../components/teacher/dashboard/StudentAlertsCard'
import { CompetitionWidget } from '../components/teacher/dashboard/CompetitionWidget'
import { RevenueWidget } from '../components/teacher/dashboard/RevenueWidget'
import { MessagesWidget } from '../components/teacher/dashboard/MessagesWidget'
import { TaskList } from '../components/teacher/dashboard/TaskList'
import { TeacherQuickActions } from '../components/teacher/dashboard/TeacherQuickActions'
import { TeacherDashboardSkeleton } from '../components/teacher/dashboard/TeacherDashboardSkeleton'

export function TeacherDashboardPage() {
  const { user } = useApp()
  const teacherId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      teacherId
        ? fetchTeacherDashboard(teacherId)
        : Promise.reject(new Error('Not signed in')),
    [teacherId],
    { enabled: Boolean(teacherId) },
  )

  if (!user || loading) {
    return <TeacherDashboardSkeleton />
  }

  if (error || !data) {
    return (
      <PageContainer width="wide">
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
      label: 'Students',
      value: String(data.studentCount),
      icon: Users,
      hint: 'Active coaching students',
    },
    {
      label: 'Classes today',
      value: String(data.todayClasses.length),
      icon: Calendar,
      hint: 'Scheduled sessions',
    },
    {
      label: 'Monthly earnings',
      value: `₹${data.revenue.monthlyEarnings.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      hint: 'Recurring coaching revenue',
    },
    {
      label: 'Rating',
      value: data.rating ? data.rating.toFixed(1) : '—',
      icon: Star,
      hint: 'Teacher profile rating',
    },
  ]

  return (
    <PageContainer width="wide">
      <DashboardWorkspaceHeader
        workspaceTitle={TERMS.coachWorkspace}
        description="Manage students, classes, programs, and your coaching practice."
        userName={user.name}
      />

      {data.profileIncomplete && (
        <div className="mb-6 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            Your profile is not complete, so you are hidden from Find Teachers. Finish your profile
            and pricing in Settings.
          </p>
          <Link
            to="/dashboard/teacher/settings"
            className="text-sm font-semibold text-primary hover:underline shrink-0"
          >
            Complete profile →
          </Link>
        </div>
      )}

      <div className="mb-6 lg:mb-8">
        <QuickStats stats={stats} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <TodaysClassesCard classes={data.todayClasses} />
        <AttendanceWidget attendance={data.attendance} />
        <StudentAlertsCard alerts={data.alerts} />
        <CompetitionWidget competition={data.competition} />
        <RevenueWidget revenue={data.revenue} />
        <MessagesWidget messages={data.messages} unreadTotal={data.unreadMessages} />
        <TaskList tasks={data.tasks} />
        <TeacherQuickActions />
      </div>
    </PageContainer>
  )
}
