import { useNavigate } from 'react-router-dom'
import { Award, MapPin, Star, Users } from 'lucide-react'
import type { Teacher } from '../../types'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface TeacherCardProps {
  teacher: Teacher
  compact?: boolean
}

export function TeacherCard({ teacher, compact = false }: TeacherCardProps) {
  const navigate = useNavigate()
  const cardImage = teacher.coverPhoto || teacher.photo
  const primarySpec = teacher.specializations[0]

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
    <article className="rounded-[20px] border border-border bg-elevated overflow-hidden shadow-sm transition-shadow hover:shadow-md hover:border-accent/20">
      <div className="relative aspect-[4/5] w-full bg-sidebar-secondary">
        {cardImage ? (
          <img
            src={cardImage}
            alt={teacher.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl font-medium text-sidebar-foreground">
            {teacher.name.charAt(0).toUpperCase()}
          </div>
        )}
        {teacher.verified && (
          <Badge variant="primary" className="absolute top-3 left-3 text-xs">
            Verified
          </Badge>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">{teacher.name}</h3>
          {primarySpec && (
            <p className="text-sm text-accent mt-0.5">{primarySpec}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {teacher.specializations.slice(0, 2).map((s) => (
            <Badge key={s} variant="default" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star size={14} className="fill-accent text-accent shrink-0" />
            {teacher.rating.toFixed(1)} rating
          </span>
          <span className="inline-flex items-center gap-1">
            <Award size={14} className="text-accent shrink-0" />
            {teacher.experienceYears}y exp
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={14} className="text-accent shrink-0" />
            {teacher.totalStudents} students
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} className="text-accent shrink-0" />
            {teacher.city}
          </span>
        </div>

        <p className="text-sm font-medium text-foreground">
          ₹{teacher.monthlyFee.toLocaleString('en-IN')}
          <span className="text-muted-foreground font-normal">/month</span>
        </p>

        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={() => navigate(`/teachers/${teacher.id}`)}>
            View Profile
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(`/teachers/${teacher.id}`)}
          >
            Book Session
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
      <h2 className="mb-3 px-1 font-heading text-base font-semibold text-foreground">Featured Teachers</h2>
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
      <h2 className="mb-4 font-heading text-lg font-semibold text-foreground">Featured Teachers</h2>
      <div className="space-y-1">
        {teachers.map((t) => (
          <TeacherCard key={t.id} teacher={t} compact />
        ))}
      </div>
    </div>
  )
}
