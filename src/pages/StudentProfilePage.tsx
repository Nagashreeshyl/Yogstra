import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Award,
  Building2,
  Calendar,
  Flame,
  MapPin,
  MessageCircle,
  Settings,
  Trophy,
  User,
} from 'lucide-react'
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

function ProfileSection({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="py-10 border-b border-border last:border-0 scroll-mt-20">
      <h2 className="font-heading text-xl font-semibold text-foreground mb-5">{title}</h2>
      {children}
    </section>
  )
}

export function StudentProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useApp()

  const { data: student, loading, refetch: refetchStudent } = useAsyncData(
    () => fetchStudentById(id!),
    [id],
  )

  const { data: posts, refetch: refetchPosts } = useAsyncData(() => fetchPosts(), [])

  useLiveSync(refetchStudent, ['teachers'], Boolean(id))
  useLiveSync(refetchPosts, ['posts'], Boolean(id))

  const studentPosts = (posts ?? []).filter((p) => p.studentId === id).slice(0, 6)
  const isTeacher = user?.role === 'teacher'
  const isOwnProfile = user?.id === id

  const handleMessage = () => {
    if (!user || user.role !== 'teacher' || !student) return
    navigate(messagesPathForRole('teacher'), {
      state: buildChatNavigationState(
        { id: student.id, name: student.name, avatar: student.avatar },
        'student',
      ),
    })
  }

  if (loading) return <ProfilePageSkeleton />

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
    <PageContainer width="default" className="pb-16">
      {/* Profile Hero */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-10 border-b border-border">
        <Avatar src={student.avatar} name={student.name} size={120} className="ring-4 ring-background" />
        <div className="flex-1 text-center sm:text-left min-w-0">
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">{student.name}</h1>
          <Badge className="mt-2">{student.level}</Badge>
          {location && (
            <p className="text-sm text-muted-foreground mt-3 inline-flex items-center gap-1.5">
              <MapPin size={14} /> {location}
            </p>
          )}
          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} className="text-accent" />
              {student.totalSessions} sessions completed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Flame size={14} className="text-accent" />
              Member since {formatJoinedDate(student.joinedDate)}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-3">
            {isTeacher && (
              <Button size="sm" className="gap-1.5" onClick={handleMessage}>
                <MessageCircle size={16} /> Message
              </Button>
            )}
            {isOwnProfile && (
              <Link to="/dashboard/student/settings">
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <Settings size={16} /> Settings
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <ProfileSection title="Academy" id="academy">
        <Card className="p-5 max-w-lg">
          <div className="flex items-center gap-3">
            <Building2 size={20} className="text-accent shrink-0" />
            <p className="text-sm text-muted-foreground">Academy enrollment details will appear here when the student joins an academy.</p>
          </div>
        </Card>
      </ProfileSection>

      <ProfileSection title="Coach" id="coach">
        <Card className="p-5 max-w-lg">
          {student.activeTeacherName ? (
            <div className="flex items-center gap-3">
              <User size={20} className="text-accent shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Current Coach</p>
                {student.activeTeacherId ? (
                  <Link to={`/teachers/${student.activeTeacherId}`} className="font-medium text-accent hover:underline">
                    {student.activeTeacherName}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{student.activeTeacherName}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Not enrolled with a coach yet.</p>
          )}
        </Card>
      </ProfileSection>

      <ProfileSection title="Current Programs" id="programs">
        <Card className="p-5 max-w-lg">
          <p className="text-sm text-muted-foreground">
            {student.activeTeacherName
              ? `Active programs with ${student.activeTeacherName} will appear here.`
              : 'Enroll in a program to see your active training here.'}
          </p>
        </Card>
      </ProfileSection>

      <ProfileSection title="Competition History" id="competitions">
        <Card className="p-5 max-w-lg">
          <div className="flex items-start gap-3">
            <Trophy size={20} className="text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">Competition registrations and results will appear here.</p>
          </div>
        </Card>
      </ProfileSection>

      <ProfileSection title="Certificates" id="certificates">
        <Card className="p-5 max-w-lg">
          <div className="flex items-start gap-3">
            <Award size={20} className="text-accent shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">Competition certificates earned by this student will appear here.</p>
          </div>
        </Card>
      </ProfileSection>

      <ProfileSection title="Achievements" id="achievements">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
          {[
            { icon: Calendar, label: 'Sessions', value: student.totalSessions },
            { icon: Flame, label: 'Level', value: student.level },
            { icon: Award, label: 'Achievements', value: '—' },
            { icon: Trophy, label: 'Competitions', value: '—' },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="p-4 text-center">
              <Icon size={20} className="text-accent mx-auto mb-2" />
              <p className="text-lg font-semibold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </Card>
          ))}
        </div>
      </ProfileSection>

      <ProfileSection title="Progress" id="progress">
        <Card className="p-5 max-w-lg">
          <p className="text-sm text-muted-foreground">
            {student.totalSessions > 0
              ? `${student.totalSessions} sessions completed at ${student.level} level.`
              : 'Start training to track your progress here.'}
          </p>
        </Card>
      </ProfileSection>

      {studentPosts.length > 0 && (
        <ProfileSection title="Community Activity" id="community">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-2xl">
            {studentPosts.map((post) => (
              <div key={post.id} className="aspect-square bg-muted overflow-hidden rounded-[12px]">
                {post.image ? (
                  <img src={post.image} alt="" className="w-full h-full object-cover" loading="lazy" />
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
        </ProfileSection>
      )}

      {isOwnProfile && (
        <ProfileSection title="Settings" id="settings">
          <Card className="p-5 max-w-lg">
            <p className="text-sm text-muted-foreground mb-4">Manage your profile, notifications, and account preferences.</p>
            <Link to="/dashboard/student/settings">
              <Button size="sm" variant="secondary" className="gap-1.5">
                <Settings size={16} /> Account Settings
              </Button>
            </Link>
          </Card>
        </ProfileSection>
      )}
    </PageContainer>
  )
}
