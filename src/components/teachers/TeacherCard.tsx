import { useNavigate } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'
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
    <section className="rounded-[16px] border border-border bg-elevated p-5 shadow-sm">
      <h3 className="font-heading text-lg font-semibold text-foreground mb-4">{teacher.name}</h3>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[12px] bg-sidebar">
        {cardImage ? (
          <img
            src={cardImage}
            alt={teacher.name}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-sidebar-secondary text-5xl font-medium text-sidebar-foreground">
            {teacher.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {teacher.specializations.slice(0, 2).map((s) => (
            <Badge key={s} variant="primary" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Star size={14} className="fill-accent text-accent" />
            {teacher.rating.toFixed(1)}
          </span>
          <span>₹{teacher.monthlyFee.toLocaleString('en-IN')}/mo</span>
        </div>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin size={14} className="text-accent" />
          {teacher.city}
        </p>
        <Button size="sm" className="w-full" onClick={() => navigate(`/teachers/${teacher.id}`)}>
          View Profile
        </Button>
      </div>
    </section>
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
