import { useNavigate } from 'react-router-dom'
import { BadgeCheck, MapPin, Star, Trophy, Users } from 'lucide-react'
import type { Teacher } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { TERMS } from '../../constants/terminology'

interface TeacherCardProps {
  teacher: Teacher
  compact?: boolean
}

export function TeacherCard({ teacher, compact = false }: TeacherCardProps) {
  const navigate = useNavigate()
  const cardImage = teacher.coverPhoto || teacher.photo
  const startingPrice = Math.min(
    teacher.pricing.oneOnOneMonth || teacher.monthlyFee,
    teacher.pricing.groupMonth || teacher.monthlyFee,
  ) || teacher.monthlyFee

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => navigate(`/teachers/${teacher.id}`)}
        className="flex w-full items-center gap-3 rounded-[12px] p-3 text-left transition-colors hover:bg-muted cursor-pointer"
      >
        <Avatar src={teacher.photo} name={teacher.name} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{teacher.name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star size={12} className="fill-accent text-accent" />
            {teacher.rating.toFixed(1)}
          </div>
        </div>
      </button>
    )
  }

  return (
    <article className="group rounded-[24px] border border-border bg-elevated overflow-hidden transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-black/5 flex flex-col">
      <div className="relative aspect-[5/4] w-full bg-sidebar-secondary">
        {cardImage ? (
          <img
            src={cardImage}
            alt={teacher.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar src={teacher.photo} name={teacher.name} size={80} />
          </div>
        )}
        {teacher.verified && (
          <Badge variant="primary" className="absolute top-3 left-3 text-xs gap-1">
            <BadgeCheck size={12} />
            Verified
          </Badge>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">{teacher.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <Star size={14} className="fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">{teacher.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">· {teacher.experienceYears} years</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {teacher.specializations.slice(0, 3).map((s) => (
            <Badge key={s} variant="default" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={13} className="text-accent shrink-0" />
            {teacher.city}{teacher.state ? `, ${teacher.state}` : ''}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users size={13} className="text-accent shrink-0" />
            {teacher.totalStudents} trained
          </span>
          {teacher.achievements.length > 0 && (
            <span className="inline-flex items-center gap-1.5 col-span-2">
              <Trophy size={13} className="text-accent shrink-0" />
              {teacher.achievements[0]}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          <Badge variant="default" className="text-xs">{TERMS.personalCoaching}</Badge>
          <Badge variant="default" className="text-xs">{TERMS.trainingBatch}</Badge>
        </div>

        {startingPrice > 0 && (
          <p className="text-sm font-semibold text-foreground">
            From ₹{startingPrice.toLocaleString('en-IN')}
            <span className="text-muted-foreground font-normal text-xs"> / month</span>
          </p>
        )}

        <div className="flex gap-2 pt-2 mt-auto">
          <Button size="sm" variant="secondary" className="flex-1" onClick={() => navigate(`/teachers/${teacher.id}`)}>
            {TERMS.bookTrial}
          </Button>
          <Button size="sm" className="flex-1" onClick={() => navigate(`/teachers/${teacher.id}`)}>
            {TERMS.viewProfile}
          </Button>
        </div>
      </div>
    </article>
  )
}

interface FeaturedTeachersProps {
  teachers: Teacher[]
}

export function MobileFeaturedTeachers({ teachers }: FeaturedTeachersProps) {
  const navigate = useNavigate()
  if (teachers.length === 0) return null

  return (
    <section className="lg:hidden -mx-1">
      <h2 className="mb-3 px-1 font-heading text-base font-semibold text-foreground">Featured Coaches</h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
        {teachers.map((teacher) => (
          <button
            key={teacher.id}
            type="button"
            onClick={() => navigate(`/teachers/${teacher.id}`)}
            className="flex w-[5.5rem] shrink-0 snap-start cursor-pointer flex-col items-center gap-2"
          >
            <Avatar src={teacher.photo} name={teacher.name} size={56} />
            <span className="w-full truncate text-center text-xs font-medium text-foreground">
              {teacher.name.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export function FeaturedTeachers({ teachers }: FeaturedTeachersProps) {
  return (
    <div>
      <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Featured Coaches</h2>
      <div className="space-y-1">
        {teachers.map((t) => (
          <TeacherCard key={t.id} teacher={t} compact />
        ))}
      </div>
    </div>
  )
}
