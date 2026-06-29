import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Award,
  BadgeCheck,
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

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-10 border-b border-border last:border-0">
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
  const { hasActivePurchase, refetchActivePurchase } = useActiveClassPurchase(user?.id, id, isStudent && Boolean(id))

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
      {/* Cover + Hero */}
      <div className="relative">
        <div className="h-48 sm:h-64 lg:h-72 bg-gradient-to-br from-sidebar via-accent/20 to-sidebar-secondary overflow-hidden">
          {coverImage && (
            <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
        </div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row gap-6 pb-8">
            <Avatar src={teacher.photo} name={teacher.name} size={128} className="ring-4 ring-background shrink-0" />
            <div className="flex-1 pt-2 sm:pt-16">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">{teacher.name}</h1>
                {teacher.verified && (
                  <Badge variant="verified" className="gap-1">
                    <BadgeCheck size={12} /> Verified Coach
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm sm:text-base mb-3">
                {teacher.specializations.slice(0, 2).join(' · ')}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <StarRating rating={teacher.rating} size={14} />
                <span className="inline-flex items-center gap-1"><Users size={14} />{teacher.totalStudents} students trained</span>
                <span className="inline-flex items-center gap-1"><MapPin size={14} />{teacher.city}</span>
                <span>{teacher.experienceYears} years experience</span>
              </div>
              <div className="hidden sm:flex flex-wrap gap-3">
                {isStudent && (
                  <>
                    <Button onClick={() => void handleTrial()} disabled={requesting}>{requesting ? 'Booking…' : TERMS.bookTrial}</Button>
                    {!hasActivePurchase && (
                      <Button variant="secondary" onClick={() => void handleEnroll()} disabled={openingBuy}>
                        {openingBuy ? 'Opening…' : TERMS.enrollInProgram}
                      </Button>
                    )}
                    <Button variant="secondary" onClick={openChat} className="gap-1.5">
                      <MessageCircle size={16} />{TERMS.messageCoach}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      {isStudent && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-3 flex gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => void handleTrial()} disabled={requesting}>
            {TERMS.bookTrial}
          </Button>
          <Button size="sm" className="flex-1" onClick={() => void handleEnroll()} disabled={openingBuy}>
            {TERMS.enrollInProgram}
          </Button>
        </div>
      )}

      <PageContainer width="default" className="pb-24 sm:pb-14">
        {requestError && (
          <p className="mb-6 rounded-[12px] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{requestError}</p>
        )}

        <ProfileSection title="About">
          <p className="text-muted-foreground leading-relaxed max-w-3xl">{teacher.bio || 'This coach has not added a bio yet.'}</p>
          {teacher.teachingStyle && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-3xl">
              <strong className="text-foreground">Teaching approach:</strong> {teacher.teachingStyle}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mt-4">
            {teacher.specializations.map((s) => <Badge key={s}>{s}</Badge>)}
          </div>
        </ProfileSection>

        <ProfileSection title="Programs">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-[20px] border border-border bg-elevated p-6">
              <h3 className="font-medium text-foreground mb-1">{TERMS.trainingBatch}</h3>
              <p className="text-sm text-muted-foreground mb-4">Group training sessions with structured curriculum.</p>
              <p className="text-sm font-semibold text-foreground">
                {teacher.pricing.groupMonth > 0 ? `₹${teacher.pricing.groupMonth.toLocaleString('en-IN')}/month` : 'Contact for pricing'}
              </p>
            </div>
            <div className="rounded-[20px] border border-border bg-elevated p-6">
              <h3 className="font-medium text-foreground mb-1">{TERMS.personalCoaching}</h3>
              <p className="text-sm text-muted-foreground mb-4">One-on-one sessions tailored to your goals.</p>
              <p className="text-sm font-semibold text-foreground">
                {teacher.pricing.oneOnOneMonth > 0 ? `₹${teacher.pricing.oneOnOneMonth.toLocaleString('en-IN')}/month` : 'Contact for pricing'}
              </p>
            </div>
            {teacher.achievements.some((a) => a.toLowerCase().includes('competition')) && (
              <div className="rounded-[20px] border border-border bg-elevated p-6 sm:col-span-2">
                <h3 className="font-medium text-foreground mb-1">{TERMS.competitionCoaching}</h3>
                <p className="text-sm text-muted-foreground">Competition preparation and performance coaching.</p>
              </div>
            )}
          </div>
        </ProfileSection>

        <ProfileSection title="Achievements & Certifications">
          {teacher.achievements.length > 0 ? (
            <ul className="space-y-3">
              {teacher.achievements.map((a) => (
                <li key={a} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Trophy size={16} className="text-accent shrink-0 mt-0.5" />
                  {a}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Achievements will appear here.</p>
          )}
          {teacher.certifications && (
            <div className="mt-6 flex items-start gap-3 text-sm text-muted-foreground">
              <Award size={16} className="text-accent shrink-0 mt-0.5" />
              {teacher.certifications}
            </div>
          )}
        </ProfileSection>

        <ProfileSection title="Student Reviews">
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="fill-accent text-accent" />
            <span className="font-semibold text-foreground">{teacher.rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">average rating</span>
          </div>
          <p className="text-sm text-muted-foreground">Reviews from enrolled students will appear here.</p>
        </ProfileSection>

        <ProfileSection title="FAQs & Policies">
          <div className="space-y-4 text-sm text-muted-foreground max-w-2xl">
            <details className="rounded-[12px] border border-border px-4 py-3">
              <summary className="font-medium text-foreground cursor-pointer">What should I bring to my first class?</summary>
              <p className="mt-2">A yoga mat, comfortable clothing, and water. Your coach may share specific requirements before your first session.</p>
            </details>
            <details className="rounded-[12px] border border-border px-4 py-3">
              <summary className="font-medium text-foreground cursor-pointer">What is the cancellation policy?</summary>
              <p className="mt-2">Contact your coach directly for cancellation and rescheduling. Policies may vary by program.</p>
            </details>
          </div>
        </ProfileSection>

        <ProfileSection title="Get in Touch">
          <p className="text-muted-foreground mb-4">Have questions before enrolling? Reach out to {teacher.name.split(' ')[0]}.</p>
          {isStudent && (
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void handleTrial()} disabled={requesting}>{TERMS.bookTrial}</Button>
              <Button variant="secondary" onClick={() => void handleEnroll()} disabled={openingBuy}>{TERMS.enrollInProgram}</Button>
              <Button variant="secondary" onClick={openChat} className="gap-1.5"><MessageCircle size={16} />{TERMS.messageCoach}</Button>
            </div>
          )}
        </ProfileSection>
      </PageContainer>

      {isStudent && user && buyThreadId && (
        <BuyClassModal
          isOpen={buyOpen}
          onClose={() => { setBuyOpen(false); void refetchActivePurchase(true) }}
          studentId={user.id}
          studentName={user.name}
          teacherId={teacher.id}
          teacherName={teacher.name}
          threadId={buyThreadId}
        />
      )}
    </>
  )
}
