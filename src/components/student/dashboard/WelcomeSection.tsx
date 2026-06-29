import { Link } from 'react-router-dom'
import { GraduationCap, Sparkles } from 'lucide-react'
import { Avatar } from '../../ui/Avatar'
import { getStudentGreeting, type StudentDashboardCoach } from '../../../services/studentDashboard'

interface WelcomeSectionProps {
  studentName: string
  coach: StudentDashboardCoach | null
  academyName: string | null
}

export function WelcomeSection({ studentName, coach, academyName }: WelcomeSectionProps) {
  return (
    <section className="mb-6 lg:mb-8">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
          <Sparkles size={22} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">Your training hub</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {getStudentGreeting(studentName)}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {academyName ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                <GraduationCap size={14} aria-hidden />
                {academyName}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
                Independent student
              </span>
            )}
            {coach ? (
              <Link
                to={`/dashboard/student/teachers/${coach.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 hover:bg-muted/80 transition-colors"
              >
                <Avatar src={coach.photo} name={coach.name} size={20} />
                Coach: {coach.name}
              </Link>
            ) : (
              <Link
                to="/dashboard/student/teachers"
                className="text-primary hover:underline"
              >
                Find a coach
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
