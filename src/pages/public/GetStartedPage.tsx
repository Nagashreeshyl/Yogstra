import { Link } from 'react-router-dom'
import { AuthLayout } from '../../components/public/AuthLayout'
import { JourneyCard, JourneyGrid } from '../../components/public/JourneyCard'

export function GetStartedPage() {
  return (
    <AuthLayout
      title="Why are you joining Yogstra?"
      description="Choose your onboarding journey — not a role, but the path that fits your goals."
    >
      <JourneyGrid>
        <JourneyCard
          emoji="🧘"
          title="Learn Yoga"
          description="Find teachers, join academies, and compete on the student dashboard."
          steps={[
            { label: 'Student signup' },
            { label: 'Teacher marketplace' },
            { label: 'Competition platform' },
            { label: 'Student dashboard' },
          ]}
          to="/auth/student"
        />
        <JourneyCard
          emoji="👨‍🏫"
          title="Teach Yoga"
          description="Get verified, grow your students, and manage classes professionally."
          steps={[
            { label: 'Teacher verification' },
            { label: 'Admin approval' },
            { label: 'Teacher dashboard' },
          ]}
          to="/auth/teacher/register"
        />
        <JourneyCard
          emoji="🏫"
          title="Manage an Academy"
          description="Run batches, teachers, finance, and attendance from one command center."
          steps={[
            { label: 'Academy registration' },
            { label: 'Verification' },
            { label: 'Create first batch' },
            { label: 'Academy dashboard' },
          ]}
          to="/auth/student"
        />
        <JourneyCard
          emoji="🏆"
          title="Organize Competitions"
          description="Set up events, assign judges, and publish results at scale."
          steps={[
            { label: 'Organizer registration' },
            { label: 'Verification' },
            { label: 'Organizer dashboard' },
          ]}
          to="/auth/teacher/register"
        />
      </JourneyGrid>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/auth/login" className="text-accent hover:underline font-medium">
          Log in
        </Link>
      </p>
    </AuthLayout>
  )
}
