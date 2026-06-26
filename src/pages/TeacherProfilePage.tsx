import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, BadgeCheck, Users } from 'lucide-react'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchTeacherById } from '../services/teachers'
import { useApp } from '../context/AppContext'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { StarRating } from '../components/ui/StarRating'

const tabs = ['About', 'Teaching Style', 'Achievements', 'Reviews'] as const

export function TeacherProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { requireAuth } = useApp()
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('About')
  const { data: teacher, loading } = useAsyncData(
    () => fetchTeacherById(id!),
    [id],
  )

  if (loading) {
    return <div className="p-8 text-charcoal/50">Loading profile...</div>
  }

  if (!teacher) {
    return (
      <div className="p-8 text-center">
        <p className="text-charcoal/50 mb-4">Teacher not found.</p>
        <Button onClick={() => navigate('/teachers')}>Back to Teachers</Button>
      </div>
    )
  }

  const handleRequest = () => {
    if (!requireAuth()) return
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row gap-8 mb-8 pb-8 border-b border-border">
        <img
          src={teacher.photo}
          alt={teacher.name}
          className="w-40 h-40 rounded-sm object-cover shrink-0"
        />
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
          <Button className="mt-6" onClick={handleRequest}>
            Request Teacher
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm transition-colors cursor-pointer border-b-2 -mb-px ${
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
        {activeTab === 'Reviews' && (
          <p className="text-charcoal/50 text-sm">Reviews will appear here once students leave feedback.</p>
        )}
      </div>
    </div>
  )
}
