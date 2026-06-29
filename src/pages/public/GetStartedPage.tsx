import { Link } from 'react-router-dom'
import { Building2, GraduationCap, Trophy, Users } from 'lucide-react'
import { AuthLayout } from '../../components/public/AuthLayout'
import { JourneyCard, JourneyGrid } from '../../components/public/JourneyCard'
import { TERMS } from '../../constants/terminology'

export function GetStartedPage() {
  return (
    <AuthLayout
      title="Welcome to Yogstra"
      description="Choose how you'd like to get started."
    >
      <JourneyGrid>
        <JourneyCard
          icon={GraduationCap}
          title={TERMS.learnYoga}
          subtitle="Start your yoga journey with expert guidance."
          bullets={[
            'Discover expert coaches',
            'Join structured programs',
            'Track your progress',
            'Compete with confidence',
          ]}
          to="/auth/student"
          cta={TERMS.getStarted}
        />
        <JourneyCard
          icon={Users}
          title={TERMS.becomeCoach}
          subtitle="Build a professional coaching practice on Yogstra."
          bullets={[
            'Teach students worldwide',
            'Create training programs',
            'Manage batches and schedules',
            'Grow your coaching business',
          ]}
          to="/auth/teacher/register"
          cta={TERMS.applyAsCoach}
        />
        <JourneyCard
          icon={Building2}
          title={TERMS.runAcademy}
          subtitle="Run your academy like a professional institution."
          bullets={[
            'Manage teachers and staff',
            'Enroll and track students',
            'Launch programs and batches',
            'Handle operations in one place',
          ]}
          to="/auth/academy"
          cta={TERMS.registerAcademy}
        />
        <JourneyCard
          icon={Trophy}
          title={TERMS.hostCompetitions}
          subtitle="Organize world-class yoga competitions."
          bullets={[
            'Create competitions and events',
            'Manage registrations',
            'Assign judges and score',
            'Publish results and certificates',
          ]}
          to="/auth/organizer"
          cta={TERMS.registerOrganizer}
        />
      </JourneyGrid>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-accent hover:underline font-medium">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
