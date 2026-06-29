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
        className="flex items-center gap-3 w-full text-left p-3 rounded-sm hover:bg-muted transition-colors cursor-pointer"
      >
        <Avatar src={teacher.photo} name={teacher.name} size={48} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{teacher.name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star size={12} className="text-primary fill-teal" />
            {teacher.rating.toFixed(1)}
          </div>
        </div>
      </button>
    )
  }

  return (
    <div
      className="relative w-full h-[300px] sm:h-[380px] lg:h-[440px] rounded-xl overflow-hidden bg-primary"
    >
      {cardImage ? (
        <img
          src={cardImage}
          alt={teacher.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '64px',
            fontWeight: 500,
          }}
        >
          {teacher.name.charAt(0).toUpperCase()}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(245, 236, 215, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '12px',
        }}
      >
        <h3 className="font-heading font-medium text-sm mb-1 truncate">{teacher.name}</h3>
        <div className="flex flex-wrap gap-1 mb-2">
          {teacher.specializations.slice(0, 2).map((s) => (
            <Badge key={s} className="text-xs">
              {s}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Star size={12} className="text-primary fill-teal" />
            {teacher.rating.toFixed(1)}
          </span>
          <span>₹{teacher.monthlyFee.toLocaleString('en-IN')}/mo</span>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
          <MapPin size={12} />
          {teacher.city}
        </p>
        <Button
          size="sm"
          className="w-full"
          onClick={() => navigate(`/teachers/${teacher.id}`)}
        >
          View Profile
        </Button>
      </div>
    </div>
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
      <h2 className="font-heading text-base font-medium mb-3 px-1">Featured Teachers</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 px-1 snap-x snap-mandatory">
        {teachers.map((teacher) => (
          <button
            key={teacher.id}
            type="button"
            onClick={() => navigate(`/teachers/${teacher.id}`)}
            className="shrink-0 w-[5.5rem] flex flex-col items-center gap-2 snap-start cursor-pointer"
          >
            <Avatar src={teacher.photo} name={teacher.name} size={56} />
            <span className="text-xs font-medium text-foreground truncate w-full text-center">
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
      <h2 className="font-heading text-lg font-medium mb-4">Featured Teachers</h2>
      <div className="space-y-1">
        {teachers.map((t) => (
          <TeacherCard key={t.id} teacher={t} compact />
        ))}
      </div>
    </div>
  )
}
