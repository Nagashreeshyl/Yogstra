import { Link } from 'react-router-dom'
import { GraduationCap, Users } from 'lucide-react'
import { AuthLayout } from '../../components/public/AuthLayout'
import { JourneyCard, JourneyGrid } from '../../components/public/JourneyCard'
import { TERMS } from '../../constants/terminology'

const journeys = [
  {
    icon: GraduationCap,
    title: TERMS.learnYoga,
    description:
      'Discover verified coaches, join structured programs, compete, and track your progress — all in one place.',
    to: '/auth/student',
    cta: TERMS.continueAsStudent,
  },
  {
    icon: Users,
    title: TERMS.becomeTeacher,
    description:
      'Start as a coach and unlock Academy, Competition, and Judge workspaces as your practice grows. One account, one login.',
    to: '/auth/teacher/register',
    cta: TERMS.applyAsTeacher,
  },
] as const

export function GetStartedPage() {
  return (
    <AuthLayout
      variant="wide"
      title="Join Yogstra"
      description="Choose how you want to begin. Teachers unlock additional workspaces after verification."
    >
      <JourneyGrid>
        {journeys.map((journey) => (
          <JourneyCard key={journey.to} {...journey} />
        ))}
      </JourneyGrid>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-accent hover:underline font-medium">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
