import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  GraduationCap,
  IndianRupee,
  Trophy,
  Users,
} from 'lucide-react'
import { PublicSection } from '../../components/public/PublicSection'
import { Button } from '../../components/ui/Button'

const roles = [
  {
    icon: GraduationCap,
    title: 'Students',
    description:
      'Discover coaches and academies, join structured programs, attend live classes, track progress, and compete — all in one place.',
    cta: 'Get Started as Student',
    to: '/auth/student',
  },
  {
    icon: Users,
    title: 'Coaches',
    description:
      'Build a professional coaching profile, create training programs, manage students and batches, and grow your practice.',
    cta: 'Apply as Coach',
    to: '/auth/teacher/register',
  },
  {
    icon: Building2,
    title: 'Academies',
    description:
      'Run your academy with tools for teachers, students, programs, schedules, attendance, and finance.',
    cta: 'Register Academy',
    to: '/auth/academy',
  },
  {
    icon: Trophy,
    title: 'Competition Organizers',
    description:
      'Create competitions, manage registrations, assign judges, score performances, and publish results and certificates.',
    cta: 'Register Organizer',
    to: '/auth/organizer',
  },
]

export function HowYogstraWorksPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
            How Yogstra Works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Yogstra is free to join. We earn a small platform commission only when a successful paid enrollment
            or competition registration happens.
          </p>
        </div>
      </section>

      <PublicSection title="Built for every role" description="One platform — four powerful experiences.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {roles.map(({ icon: Icon, title, description, cta, to }) => (
            <div key={title} className="rounded-[24px] border border-border bg-elevated p-8 flex flex-col">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] bg-accent/10 text-accent mb-5">
                <Icon size={22} />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-3">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">{description}</p>
              <Link to={to}>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  {cta}
                  <ArrowRight size={14} />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </PublicSection>

      <PublicSection
        title="Platform commission"
        description="Transparent, success-based pricing."
        className="bg-muted/20"
        centered
      >
        <div className="max-w-2xl mx-auto rounded-[24px] border border-border bg-elevated p-8 sm:p-10 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent mb-6">
            <IndianRupee size={28} />
          </div>
          <h3 className="font-heading text-xl font-semibold text-foreground mb-4">
            Pay only when value is delivered
          </h3>
          <ul className="text-sm text-muted-foreground space-y-3 text-left max-w-md mx-auto">
            <li className="flex gap-2">
              <span className="text-accent shrink-0">✓</span>
              Free to create an account and explore the platform
            </li>
            <li className="flex gap-2">
              <span className="text-accent shrink-0">✓</span>
              Coaches and academies set their own program fees
            </li>
            <li className="flex gap-2">
              <span className="text-accent shrink-0">✓</span>
              Yogstra takes a small commission on successful paid enrollments
            </li>
            <li className="flex gap-2">
              <span className="text-accent shrink-0">✓</span>
              Competition entry fees include a platform fee when applicable
            </li>
            <li className="flex gap-2">
              <span className="text-accent shrink-0">✓</span>
              Secure online payments handled directly in the app
            </li>
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            No monthly subscriptions. No hidden fees. Yogstra grows when you grow.
          </p>
        </div>
      </PublicSection>

      <PublicSection title="Ready to begin?" centered>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth/get-started">
            <Button size="lg">
              Get Started
              <ArrowRight size={18} className="ml-1" />
            </Button>
          </Link>
          <Link to="/discover">
            <Button variant="secondary" size="lg">
              Explore Platform
            </Button>
          </Link>
        </div>
      </PublicSection>
    </>
  )
}
