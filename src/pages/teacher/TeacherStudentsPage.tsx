import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchTeacherStudents } from '../../services/students'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { ErrorState } from '../../components/shell/ErrorState'
import { Card } from '../../components/ui/Card'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { buildChatNavigationState, messagesPathForRole } from '../../utils/chatNavigation'
import { studentProfilePath } from '../../utils/chatRoutes'

export function TeacherStudentsPage() {
  const { user } = useApp()
  const navigate = useNavigate()
  const { data: students, loading, error, refetch } = useAsyncData(
    () => (user ? fetchTeacherStudents(user.id) : Promise.resolve([])),
    [user?.id],
  )

  useLiveDataRefresh(refetch, ['bookings'], Boolean(user?.id))

  return (
    <PageContainer width="narrow">
      <div className="space-y-6">
        <PageHeader
          title="My Students"
          description="Students appear here after they book classes with you."
        />

        {loading ? (
          <TeacherTableSkeleton rows={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => void refetch()} />
        ) : (students ?? []).length === 0 ? (
          <EmptyState title="No active students yet" description="Students appear here after they book classes with you." />
        ) : (
          <div className="space-y-3">
            {students!.map((s) => (
              <Card key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <Link to={studentProfilePath(s.id, 'teacher')} className="flex items-center gap-4 min-w-0 group">
                <Avatar src={s.avatar} name={s.name} size={48} />
                <div className="min-w-0">
                  <p className="font-semibold truncate group-hover:text-primary transition-colors">
                    {s.name}
                  </p>
                  <Badge className="mt-1">{s.level}</Badge>
                </div>
              </Link>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    navigate(messagesPathForRole('teacher'), {
                      state: buildChatNavigationState(
                        { id: s.id, name: s.name, avatar: s.avatar },
                        'student',
                      ),
                    })
                  }
                >
                  Message
                </Button>
                <Link to={studentProfilePath(s.id, 'teacher')}>
                  <Button size="sm">View profile</Button>
                </Link>
              </div>
            </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
