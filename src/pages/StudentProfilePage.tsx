import { Link, useNavigate, useParams } from 'react-router-dom'
import { Calendar, MapPin, Phone, User, MessageCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { useLiveSync } from '../hooks/useLiveSync'
import { fetchStudentById } from '../services/students'
import { fetchPosts } from '../services/posts'
import { PageContainer } from '../components/shell/PageContainer'
import { EmptyState } from '../components/shell/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ProfilePageSkeleton } from '../components/ui/Skeleton'
import { Card } from '../components/ui/Card'
import { buildChatNavigationState, messagesPathForRole } from '../utils/chatNavigation'

function formatJoinedDate(isoDate: string) {
  const date = new Date(isoDate)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function StudentProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useApp()

  const { data: student, loading, refetch: refetchStudent } = useAsyncData(
    () => fetchStudentById(id!),
    [id],
  )

  const { data: posts, refetch: refetchPosts } = useAsyncData(
    () => fetchPosts(),
    [],
  )

  useLiveSync(refetchStudent, ['teachers'], Boolean(id))
  useLiveSync(refetchPosts, ['posts'], Boolean(id))

  const studentPosts = (posts ?? []).filter((p) => p.studentId === id).slice(0, 6)

  const isTeacher = user?.role === 'teacher'

  const handleMessage = () => {
    if (!user || user.role !== 'teacher' || !student) return
    navigate(messagesPathForRole('teacher'), {
      state: buildChatNavigationState(
        { id: student.id, name: student.name, avatar: student.avatar },
        'student',
      ),
    })
  }

  if (loading) {
    return <ProfilePageSkeleton />
  }

  if (!student) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          title="Student not found"
          description="This student profile may have been removed."
          action={<Button onClick={() => navigate(-1)}>Go back</Button>}
        />
      </PageContainer>
    )
  }

  const location = [student.city, student.state].filter(Boolean).join(', ')

  return (
    <PageContainer width="narrow">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b border-border/70">
        <Avatar src={student.avatar} name={student.name} size={96} />
        <div className="flex-1 text-center sm:text-left min-w-0">
          <h1 className="text-xl font-semibold truncate">{student.name}</h1>
          <Badge className="mt-2">{student.level}</Badge>

          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground/70 mb-0.5">Sessions</p>
              <p className="font-semibold">{student.totalSessions}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground/70 mb-0.5">Member since</p>
              <p className="font-semibold flex items-center justify-center sm:justify-start gap-1">
                <Calendar size={14} className="text-muted-foreground/70" />
                {formatJoinedDate(student.joinedDate)}
              </p>
            </div>
          </div>

          {isTeacher && (
            <button
              type="button"
              onClick={handleMessage}
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:text-primary-dark cursor-pointer"
            >
              <MessageCircle size={16} />
              Message
            </button>
          )}
        </div>
      </div>

      <section className="space-y-4 mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground">About</h2>
        <Card className="p-4 space-y-3 text-sm">
          {student.phone && (
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-muted-foreground/70 shrink-0" />
              <span>{student.phone}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-muted-foreground/70 shrink-0" />
              <span>{location}</span>
            </div>
          )}
          {student.activeTeacherName ? (
            <div className="flex items-start gap-3">
              <User size={16} className="text-muted-foreground/70 shrink-0 mt-0.5" />
              <div>
                <p className="text-muted-foreground/70 text-xs mb-0.5">Active teacher</p>
                {student.activeTeacherId ? (
                  <Link
                    to={`/teachers/${student.activeTeacherId}`}
                    className="font-semibold text-primary hover:text-primary-dark"
                  >
                    {student.activeTeacherName}
                  </Link>
                ) : (
                  <span className="font-semibold">{student.activeTeacherName}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground/70 text-sm">Not enrolled with a teacher yet.</p>
          )}
        </Card>
      </section>

      {studentPosts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Community posts</h2>
          <div className="grid grid-cols-3 gap-1">
            {studentPosts.map((post) => (
              <div
                key={post.id}
                className="aspect-square bg-sidebar/5 overflow-hidden rounded-sm"
              >
                {post.image ? (
                  <img src={post.image} alt="" className="w-full h-full object-cover" />
                ) : post.video ? (
                  <video src={post.video} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <p className="text-xs text-muted-foreground text-center line-clamp-4">{post.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  )
}
