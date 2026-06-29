import { Link } from 'react-router-dom'
import { Building2, GraduationCap, Trophy, Users } from 'lucide-react'
import { AuthLayout } from '../../components/public/AuthLayout'
import { JourneyCard, JourneyGrid } from '../../components/public/JourneyCard'
import { TERMS } from '../../constants/terminology'

const journeys = [
  {
    icon: GraduationCap,
    title: TERMS.learnYoga,
    description: 'Discover expert coaches, join structured programs, and track your progress on Yogstra.',
    to: '/auth/student',
    cta: 'Continue as Student',
  },
  {
    icon: Users,
    title: TERMS.becomeCoach,
    description: 'Build a professional coaching practice with programs, batches, and student management.',
    to: '/auth/teacher/register',
    cta: TERMS.applyAsCoach,
  },
  {
    icon: Building2,
    title: 'Register an Academy',
    description: 'Run your academy like a professional institution with teachers, students, and operations in one place.',
    to: '/auth/academy',
    cta: TERMS.registerAcademy,
  },
  {
    icon: Trophy,
    title: 'Organize Competitions',
    description: 'Create competitions, manage registrations, assign judges, and publish results and certificates.',
    to: '/auth/organizer',
    cta: 'Apply as Organizer',
  },
] as const

export function GetStartedPage() {
  return (
    <AuthLayout
      variant="wide"
      title="Join Yogstra"
      description="Choose how you want to use Yogstra."
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
