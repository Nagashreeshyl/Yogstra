import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { StarRating } from '../ui/StarRating'
import type { Teacher } from '../../types'

interface TeacherCardProps {
  teacher: Teacher
  compact?: boolean
}

export function TeacherCard({ teacher, compact = false }: TeacherCardProps) {
  const navigate = useNavigate()

  const handleViewProfile = () => {
    navigate(`/teachers/${teacher.id}`)
  }

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex flex-col items-center text-center">
          <img
            src={teacher.photo}
            alt={teacher.name}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />
          <h3 className="font-heading font-medium text-sm mb-1">{teacher.name}</h3>
          <div className="flex flex-wrap justify-center gap-1 mb-2">
            {teacher.specializations.slice(0, 2).map((s) => (
              <Badge key={s} className="text-[10px]">{s}</Badge>
            ))}
          </div>
          <StarRating rating={teacher.rating} size={12} />
          <p className="text-xs text-charcoal/50 mt-1">{teacher.experienceYears} yrs exp</p>
          <p className="text-sm font-medium mt-1">₹{teacher.monthlyFee.toLocaleString('en-IN')}/mo</p>
          <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5">
            <MapPin size={10} /> {teacher.city}
          </p>
          <Button size="sm" className="mt-3 w-full" onClick={handleViewProfile}>
            View Profile
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <img
        src={teacher.photo}
        alt={teacher.name}
        className="w-full h-48 object-cover rounded-sm mb-4"
      />
      <h3 className="font-heading text-lg font-medium mb-2">{teacher.name}</h3>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {teacher.specializations.map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
      </div>
      <StarRating rating={teacher.rating} />
      <div className="flex items-center justify-between mt-3 text-sm text-charcoal/70">
        <span>{teacher.experienceYears} years</span>
        <span className="font-medium text-charcoal">₹{teacher.monthlyFee.toLocaleString('en-IN')}/mo</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-charcoal/50 flex items-center gap-1">
          <MapPin size={12} /> {teacher.city}
        </span>
        <Badge variant="mode">{teacher.teachingMode}</Badge>
      </div>
      <Button className="mt-4 w-full" onClick={handleViewProfile}>
        View Profile
      </Button>
    </Card>
  )
}

interface FeaturedTeachersProps {
  teachers: Teacher[]
}

export function FeaturedTeachers({ teachers }: FeaturedTeachersProps) {
  return (
    <div>
      <h2 className="font-heading text-lg font-medium mb-4">Featured Teachers</h2>
      <div className="space-y-4">
        {teachers.map((t) => (
          <TeacherCard key={t.id} teacher={t} compact />
        ))}
      </div>
    </div>
  )
}
