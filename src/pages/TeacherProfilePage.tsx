import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, BadgeCheck, Users, MessageCircle, ShoppingBag } from 'lucide-react'
import { useAsyncData } from '../hooks/useAsyncData'
import { useLiveSync } from '../hooks/useLiveSync'
import { fetchTeacherById } from '../services/teachers'
import { requestTeacherWithIntro } from '../services/teacherRequest'
import { ensureDirectChat, formatChatError } from '../services/directChat'
import { useApp } from '../context/AppContext'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { StarRating } from '../components/ui/StarRating'
import { ProfilePageSkeleton } from '../components/ui/Skeleton'
import { BuyClassModal } from '../components/chat/BuyClassModal'
import { buildChatNavigationState, messagesPathForRole } from '../utils/chatNavigation'

const tabs = ['About', 'Teaching Style', 'Achievements', 'Pricing', 'Reviews'] as const

export function TeacherProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { requireAuth, user } = useApp()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('About')
  const [requesting, setRequesting] = useState(false)
  const [openingBuy, setOpeningBuy] = useState(false)
  const [buyOpen, setBuyOpen] = useState(false)
  const [buyThreadId, setBuyThreadId] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestNotice, setRequestNotice] = useState<string | null>(null)
  const { data: teacher, loading, refetch } = useAsyncData(
    () => fetchTeacherById(id!),
    [id],
  )

  useLiveSync(refetch, ['teachers'], Boolean(id))

  const isStudent = user?.role === 'student'

  if (loading) {
    return <ProfilePageSkeleton />
  }

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <p className="text-charcoal/50 mb-4">Teacher not found.</p>
        <Button onClick={() => navigate('/teachers')}>Back to Teachers</Button>
      </div>
    )
  }

  const openChatWithTeacher = () => {
    navigate(messagesPathForRole('student'), {
      state: buildChatNavigationState(
        { id: teacher.id, name: teacher.name, photo: teacher.photo, verified: teacher.verified },
        'teacher',
      ),
    })
  }

  const handleRequest = async () => {
    if (!requireAuth()) return
    if (!user) return
    if (user.role !== 'student') {
      setRequestError('Only students can request a teacher.')
      return
    }

    setRequesting(true)
    setRequestError(null)
    setRequestNotice(null)

    try {
      const { isNewRequest } = await requestTeacherWithIntro({
        studentId: user.id,
        studentName: user.name,
        teacher,
      })

      setRequestNotice(
        isNewRequest
          ? 'Intro message sent — opening your chat. Complete payment when you are ready to book a class.'
          : 'Opening your chat with this teacher.',
      )

      openChatWithTeacher()
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Could not send your request.')
    } finally {
      setRequesting(false)
    }
  }

  const handleMessage = () => {
    if (!requireAuth()) return
    if (!user || user.role !== 'student') return
    openChatWithTeacher()
  }

  const handleBuy = async () => {
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

  return (
    <>
      <div className="p-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row gap-8 mb-8 pb-8 border-b border-border">
          <Avatar src={teacher.photo} name={teacher.name} size={160} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-heading text-3xl font-medium">{teacher.name}</h1>
              {teacher.verified && (
                <Badge variant="verified" className="flex items-center gap-1">
                  <BadgeCheck size={12} /> Verified Teacher
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {teacher.specializations.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            <StarRating rating={teacher.rating} size={16} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <p className="text-charcoal/50 text-xs">Experience</p>
                <p className="font-medium">{teacher.experienceYears} years</p>
              </div>
              <div>
                <p className="text-charcoal/50 text-xs">Students</p>
                <p className="font-medium flex items-center gap-1">
                  <Users size={14} /> {teacher.totalStudents}
                </p>
              </div>
              <div>
                <p className="text-charcoal/50 text-xs">Monthly Fee</p>
                <p className="font-medium">₹{teacher.monthlyFee.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-charcoal/50 text-xs">Location</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin size={14} /> {teacher.city}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              {isStudent && (
                <>
                  <Button onClick={() => void handleRequest()} disabled={requesting}>
                    {requesting ? 'Sending request...' : 'Request Teacher'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void handleBuy()}
                    disabled={openingBuy}
                    className="gap-1.5"
                  >
                    <ShoppingBag size={16} />
                    {openingBuy ? 'Opening...' : 'Buy Class'}
                  </Button>
                  <Button variant="secondary" onClick={handleMessage} className="gap-1.5">
                    <MessageCircle size={16} />
                    Message
                  </Button>
                </>
              )}
            </div>
            {requestError && (
              <p className="text-sm text-red-600 mt-3 border border-red-200 bg-red-50 px-3 py-2 rounded-sm max-w-md">
                {requestError}
              </p>
            )}
            {requestNotice && (
              <p className="text-sm text-teal mt-3 border border-teal/30 bg-teal-soft px-3 py-2 rounded-sm max-w-md">
                {requestNotice}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab
                  ? 'border-teal text-charcoal font-medium'
                  : 'border-transparent text-charcoal/50 hover:text-charcoal'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="prose-sm max-w-none">
          {activeTab === 'About' && (
            <p className="text-charcoal/80 leading-relaxed">{teacher.bio}</p>
          )}
          {activeTab === 'Teaching Style' && (
            <p className="text-charcoal/80 leading-relaxed">{teacher.teachingStyle}</p>
          )}
          {activeTab === 'Achievements' && (
            <ul className="space-y-2">
              {teacher.achievements.map((a) => (
                <li key={a} className="text-charcoal/80 flex items-start gap-2">
                  <span className="text-teal mt-1">•</span> {a}
                </li>
              ))}
            </ul>
          )}
          {activeTab === 'Pricing' && (
            <div className="grid sm:grid-cols-2 gap-6 max-w-xl">
              <div className="border border-border rounded-sm p-4 bg-cream">
                <h3 className="font-medium mb-3">1-on-1 classes</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">1 week</span>
                    <span className="font-medium">
                      {teacher.pricing.oneOnOneWeek > 0
                        ? `₹${teacher.pricing.oneOnOneWeek.toLocaleString('en-IN')}`
                        : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">1 month</span>
                    <span className="font-medium">
                      {teacher.pricing.oneOnOneMonth > 0
                        ? `₹${teacher.pricing.oneOnOneMonth.toLocaleString('en-IN')}`
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border border-border rounded-sm p-4 bg-cream">
                <h3 className="font-medium mb-3">Group classes</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">1 week</span>
                    <span className="font-medium">
                      {teacher.pricing.groupWeek > 0
                        ? `₹${teacher.pricing.groupWeek.toLocaleString('en-IN')}`
                        : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal/60">1 month</span>
                    <span className="font-medium">
                      {teacher.pricing.groupMonth > 0
                        ? `₹${teacher.pricing.groupMonth.toLocaleString('en-IN')}`
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
              {isStudent && (
                <Button className="sm:col-span-2 gap-1.5 w-full sm:w-auto" onClick={() => void handleBuy()}>
                  <ShoppingBag size={16} />
                  Buy a class with {teacher.name.split(' ')[0]}
                </Button>
              )}
            </div>
          )}
          {activeTab === 'Reviews' && (
            <p className="text-charcoal/50 text-sm">Reviews will appear here once students leave feedback.</p>
          )}
        </div>
      </div>

      {isStudent && user && buyThreadId && (
        <BuyClassModal
          isOpen={buyOpen}
          onClose={() => setBuyOpen(false)}
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
