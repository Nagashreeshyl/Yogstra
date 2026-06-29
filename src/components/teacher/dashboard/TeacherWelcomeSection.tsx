import { Link } from 'react-router-dom'
import { Building2, Sparkles } from 'lucide-react'
import { getTeacherGreeting, getTeacherTodayLabel } from '../../../services/teacherDashboard'

interface TeacherWelcomeSectionProps {
  teacherName: string
  academyName: string | null
}

export function TeacherWelcomeSection({ teacherName, academyName }: TeacherWelcomeSectionProps) {
  return (
    <section className="mb-6 lg:mb-8">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
          <Sparkles size={22} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">Your command center</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {getTeacherGreeting(teacherName)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{getTeacherTodayLabel()}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {academyName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                <Building2 size={14} aria-hidden />
                {academyName}
              </span>
            ) : (
              <Link to="/dashboard/academy" className="text-primary hover:underline">
                Independent teacher · Set up academy
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
