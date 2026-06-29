import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Award,
  BadgeCheck,
  Calendar,
  ChevronDown,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import { useAsyncData } from '../hooks/useAsyncData'
import { useActiveClassPurchase } from '../hooks/useActiveClassPurchase'
import { useLiveDataRefresh } from '../hooks/useLiveDataRefresh'
import { fetchTeacherById } from '../services/teachers'
import { requestTeacherWithIntro } from '../services/teacherRequest'
import { ensureDirectChat, formatChatError } from '../services/directChat'
import { useApp } from '../context/AppContext'
import { PageContainer } from '../components/shell/PageContainer'
import { EmptyState } from '../components/shell/EmptyState'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { StarRating } from '../components/ui/StarRating'
import { ProfilePageSkeleton } from '../components/ui/Skeleton'
import { BuyClassModal } from '../components/chat/BuyClassModal'
import { buildChatNavigationState, messagesPathForRole } from '../utils/chatNavigation'
import { TERMS } from '../constants/terminology'

function ProfileSection({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="py-12 border-b border-border last:border-0 scroll-mt-20">
      <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-6">{title}</h2>
      {children}
    </section>
  )
}

export function TeacherProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { requireAuth, user } = useApp()
  const [requesting, setRequesting] = useState(false)
  const [openingBuy, setOpeningBuy] = useState(false)
  const [buyOpen, setBuyOpen] = useState(false)
  const [buyThreadId, setBuyThreadId] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const { data: teacher, loading, refetch } = useAsyncData(() => fetchTeacherById(id!), [id])

  useLiveDataRefresh(refetch, ['teachers'], Boolean(id))

  const isStudent = user?.role === 'student'
  const { hasActivePurchase, refetchActivePurchase } = useActiveClassPurchase(
    user?.id,
    id,
    isStudent && Boolean(id),
  )
  useLiveDataRefresh(refetchActivePurchase, ['schedules', 'bookings'], isStudent && Boolean(id))

  if (loading) return <ProfilePageSkeleton />

  if (!teacher) {
    return (
      <PageContainer>
        <EmptyState
          title="Coach not found"
          description="This coach profile may have been removed."
          action={<Button onClick={() => navigate('/teachers')}>Discover Coaches</Button>}
        />
      </PageContainer>
    )
  }

  const coverImage = teacher.coverPhoto || teacher.photo
  const startingPrice = Math.min(
    teacher.pricing.oneOnOneMonth || teacher.monthlyFee,
    teacher.pricing.groupMonth || teacher.monthlyFee,
  ) || teacher.monthlyFee
  const competitionAchievements = teacher.achievements.filter((a) =>
    a.toLowerCase().includes('competition') || a.toLowerCase().includes('champion') || a.toLowerCase().includes('medal'),
  )
  const otherAchievements = teacher.achievements.filter((a) => !competitionAchievements.includes(a))

  const openChat = () => {
    navigate(messagesPathForRole('student'), {
      state: buildChatNavigationState(
        { id: teacher.id, name: teacher.name, photo: teacher.photo, verified: teacher.verified },
        'teacher',
      ),
    })
  }

  const handleEnroll = async () => {
    if (!requireAuth()) return
    if (!user || user.role !== 'student') return
    setOpeningBuy(true)
    setRequestError(null)
    try {
      const { threadId } = await ensureDirectChat(user.id, teacher.id)
      setBuyThreadId(threadId)
      setBuyOpen(true)
    } catch (err) {
      setRequestError(formatChatError(err))
    } finally {
      setOpeningBuy(false)
    }
  }

  const handleTrial = async () => {
    if (!requireAuth()) return
    if (!user || user.role !== 'student') return
    setRequesting(true)
    setRequestError(null)
    try {
      await requestTeacherWithIntro({ studentId: user.id, studentName: user.name, teacher })
      openChat()
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Could not send your request.')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <>
      {/* Hero */}
      <div className="relative bg-sidebar-secondary">
        <div className="h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-sidebar via-accent/20 to-sidebar-secondary overflow-hidden relative">
          {coverImage && (
            <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
        </div>
        <PageContainer width="default" className="relative -mt-20 pb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <Avatar src={teacher.photo} name={teacher.name} size={128} className="ring-4 ring-background shrink-0" />
            <div className="flex-1 pt-2 sm:pt-12 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground">{teacher.name}</h1>
                {teacher.verified && (
                  <Badge variant="verified" className="gap-1">
                    <BadgeCheck size={12} /> Verified Coach
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base mb-4">
                {teacher.specializations.slice(0, 3).join(' · ')}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground mb-5">
                <StarRating rating={teacher.rating} size={14} />
                <span className="inline-flex items-center gap-1"><Users size={14} />{teacher.totalStudents} students trained</span>
                <span className="inline-flex items-center gap-1"><MapPin size={14} />{teacher.city}{teacher.state ? `, ${teacher.state}` : ''}</span>
                <span className="inline-flex items-center gap-1"><Calendar size={14} />{teacher.experienceYears} years experience</span>
              </div>
              {startingPrice > 0 && (
                <p className="text-base font-semibold text-foreground mb-5">
                  From ₹{startingPrice.toLocaleString('en-IN')}<span className="text-muted-foreground font-normal text-sm"> / month</span>
                </p>
              )}
              {isStudent && (
                <div className="hidden sm:flex flex-wrap gap-3">
                  <Button onClick={() => void handleEnroll()} disabled={openingBuy || hasActivePurchase}>
                    {openingBuy ? 'Opening…' : TERMS.enrollInProgram}
                  </Button>
                  <Button variant="secondary" onClick={() => void handleTrial()} disabled={requesting}>
                    {requesting ? 'Booking…' : TERMS.bookTrial}
                  </Button>
                  <Button variant="secondary" onClick={openChat} className="gap-1.5">
                    <MessageCircle size={16} />{TERMS.messageCoach}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Mobile sticky CTA */}
      {isStudent && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-3 flex gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Button size="sm" className="flex-1" onClick={() => void handleEnroll()} disabled={openingBuy || hasActivePurchase}>
            {TERMS.enrollInProgram}
          </Button>
          <Button size="sm" variant="secondary" className="flex-1 gap-1" onClick={openChat}>
            <MessageCircle size={14} /> Message
          </Button>
        </div>
      )}

      <PageContainer width="default" className="pb-24 sm:pb-16">
        {requestError && (
          <p className="mb-6 rounded-[12px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{requestError}</p>
        )}

        <ProfileSection title="Biography" id="biography">
          <p className="text-muted-foreground leading-relaxed max-w-3xl">{teacher.bio || 'This coach has not added a biography yet.'}</p>
          {teacher.teachingStyle && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-3xl">
              <strong className="text-foreground">Teaching approach:</strong> {teacher.teachingStyle}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-5">
            {teacher.specializations.map((s) => <Badge key={s}>{s}</Badge>)}
          </div>
        </ProfileSection>

        <ProfileSection title="Programs" id="programs">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-[20px] border border-border bg-elevated p-6">
              <h3 className="font-heading font-medium text-foreground mb-1">{TERMS.trainingBatch}</h3>
              <p className="text-sm text-muted-foreground mb-4">Group training sessions with structured curriculum and peer learning.</p>
              <p className="text-sm font-semibold text-foreground">
                {teacher.pricing.groupMonth > 0 ? `₹${teacher.pricing.groupMonth.toLocaleString('en-IN')}/month` : 'Contact for pricing'}
              </p>
            </div>
            <div className="rounded-[20px] border border-border bg-elevated p-6">
              <h3 className="font-heading font-medium text-foreground mb-1">{TERMS.personalCoaching}</h3>
              <p className="text-sm text-muted-foreground mb-4">One-on-one sessions tailored to your goals and schedule.</p>
              <p className="text-sm font-semibold text-foreground">
                {teacher.pricing.oneOnOneMonth > 0 ? `₹${teacher.pricing.oneOnOneMonth.toLocaleString('en-IN')}/month` : 'Contact for pricing'}
              </p>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection title="Personal Coaching" id="personal-coaching">
          <div className="rounded-[20px] border border-border bg-elevated p-6 max-w-2xl">
            <p className="text-sm text-muted-foreground mb-3">Dedicated 1-on-1 coaching with personalized attention and flexible scheduling.</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-muted-foreground">Weekly: {teacher.pricing.oneOnOneWeek > 0 ? `₹${teacher.pricing.oneOnOneWeek.toLocaleString('en-IN')}` : 'Contact coach'}</span>
              <span className="text-muted-foreground">Monthly: {teacher.pricing.oneOnOneMonth > 0 ? `₹${teacher.pricing.oneOnOneMonth.toLocaleString('en-IN')}` : 'Contact coach'}</span>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection title="Training Batches" id="training-batches">
          <div className="rounded-[20px] border border-border bg-elevated p-6 max-w-2xl">
            <p className="text-sm text-muted-foreground mb-3">Structured group programs with a fixed curriculum and regular class schedule.</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-muted-foreground">Weekly: {teacher.pricing.groupWeek > 0 ? `₹${teacher.pricing.groupWeek.toLocaleString('en-IN')}` : 'Contact coach'}</span>
              <span className="text-muted-foreground">Monthly: {teacher.pricing.groupMonth > 0 ? `₹${teacher.pricing.groupMonth.toLocaleString('en-IN')}` : 'Contact coach'}</span>
            </div>
          </div>
        </ProfileSection>

        {otherAchievements.length > 0 && (
          <ProfileSection title="Achievements" id="achievements">
            <ul className="space-y-3 max-w-2xl">
              {otherAchievements.map((a) => (
                <li key={a} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Award size={16} className="text-accent shrink-0 mt-0.5" />
                  {a}
                </li>
              ))}
            </ul>
            {teacher.certifications && (
              <div className="mt-6 flex items-start gap-3 text-sm text-muted-foreground max-w-2xl">
                <BadgeCheck size={16} className="text-accent shrink-0 mt-0.5" />
                {teacher.certifications}
              </div>
            )}
          </ProfileSection>
        )}

        {(competitionAchievements.length > 0 || teacher.achievements.some((a) => a.toLowerCase().includes('competition'))) && (
          <ProfileSection title="Competition Experience" id="competition">
            {competitionAchievements.length > 0 ? (
              <ul className="space-y-3 max-w-2xl">
                {competitionAchievements.map((a) => (
                  <li key={a} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <Trophy size={16} className="text-accent shrink-0 mt-0.5" />
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground max-w-2xl">This coach offers {TERMS.competitionCoaching.toLowerCase()} programs.</p>
            )}
          </ProfileSection>
        )}

        <ProfileSection title="Gallery" id="gallery">
          {coverImage ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl">
              {[teacher.photo, teacher.coverPhoto].filter(Boolean).map((src, i) => (
                <div key={i} className="aspect-square rounded-[16px] overflow-hidden bg-muted">
                  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-border bg-elevated p-8 text-center max-w-md">
              <ImageIcon size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Gallery photos will appear here when the coach adds them.</p>
            </div>
          )}
        </ProfileSection>

        <ProfileSection title="Reviews" id="reviews">
          <div className="flex items-center gap-3 mb-4">
            <Star size={20} className="fill-accent text-accent" />
            <span className="text-2xl font-semibold text-foreground">{teacher.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">average rating</span>
          </div>
          <p className="text-sm text-muted-foreground">Reviews from enrolled students will appear here as they are submitted.</p>
        </ProfileSection>

        <ProfileSection title="FAQ" id="faq">
          <div className="space-y-3 max-w-2xl">
            {[
              { q: 'What should I bring to my first class?', a: 'A yoga mat, comfortable clothing, and water. Your coach may share specific requirements before your first session.' },
              { q: 'What is the cancellation policy?', a: 'Contact your coach directly for cancellation and rescheduling. Policies may vary by program.' },
              { q: 'How do I book a trial session?', a: 'Use the Book Trial button on this profile. Your coach will confirm availability via message.' },
            ].map(({ q, a }) => (
              <details key={q} className="rounded-[16px] border border-border bg-elevated group">
                <summary className="flex items-center justify-between px-5 py-4 font-medium text-foreground cursor-pointer list-none">
                  {q}
                  <ChevronDown size={18} className="text-muted-foreground group-open:rotate-180 transition-transform shrink-0 ml-4" />
                </summary>
                <p className="px-5 pb-4 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </ProfileSection>

        <ProfileSection title="Availability" id="availability">
          <div className="rounded-[20px] border border-border bg-elevated p-6 max-w-2xl">
            <p className="text-sm text-muted-foreground">
              {teacher.teachingMode === 'Online' && 'Available for online sessions.'}
              {teacher.teachingMode === 'Offline' && `Available for in-person sessions in ${teacher.city}.`}
              {teacher.teachingMode === 'Both' && `Available for both online and in-person sessions in ${teacher.city}.`}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Message the coach to confirm specific time slots and schedule your first session.</p>
          </div>
        </ProfileSection>

        {isStudent && (
          <section className="py-12">
            <div className="rounded-[24px] border border-accent/30 bg-accent/5 p-8 sm:p-10 text-center max-w-2xl mx-auto">
              <h2 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-3">Ready to start training?</h2>
              <p className="text-sm text-muted-foreground mb-6">Enroll in a program or message {teacher.name.split(' ')[0]} to discuss your goals.</p>
              <div className="flex flex-wrap justify-center gap-3">
                {hasActivePurchase ? (
                  <>
                    <Button variant="secondary" disabled>
                      {TERMS.enrolled}
                    </Button>
                    <Button onClick={() => navigate('/dashboard/student')}>
                      {TERMS.continueTraining}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/dashboard/student/classes')}>
                      {TERMS.viewProgram}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => void handleEnroll()} disabled={openingBuy}>
                    {openingBuy ? 'Opening…' : TERMS.enrollInProgram}
                  </Button>
                )}
                <Button variant="secondary" onClick={openChat} className="gap-1.5">
                  <MessageCircle size={16} />
                  {TERMS.messageCoach}
                </Button>
              </div>
            </div>
          </section>
        )}
      </PageContainer>

      {isStudent && user && buyThreadId && (
        <BuyClassModal
          isOpen={buyOpen}
          onClose={() => {
            setBuyOpen(false)
            void refetchActivePurchase(true)
          }}
          studentId={user.id}
          studentName={user.name}
          teacherId={teacher.id}
          teacherName={teacher.name}
          threadId={buyThreadId}
          onEnrollmentComplete={() => refetchActivePurchase(true)}
        />
      )}
    </>
  )
}
