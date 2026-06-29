import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Check,
  GraduationCap,
  IndianRupee,
  LayoutGrid,
  Trophy,
  Users,
} from 'lucide-react'
import { PublicSection } from '../../components/public/PublicSection'
import { Button } from '../../components/ui/Button'
import { TERMS } from '../../constants/terminology'

const accountTypes = [
  {
    icon: GraduationCap,
    title: 'Students',
    description:
      'Discover coaches and academies, join structured programs, attend live classes, track progress, and compete.',
    cta: TERMS.continueAsStudent,
    to: '/auth/student',
  },
  {
    icon: Users,
    title: 'Teachers',
    description:
      'One account unlocks multiple workspaces — Coach, Academy, Competitions, and Judge (when assigned).',
    cta: TERMS.applyAsTeacher,
    to: '/auth/teacher/register',
  },
] as const

const workspaces = [
  {
    icon: LayoutGrid,
    title: TERMS.coachWorkspace,
    text: 'Build your profile, create programs, manage students and batches.',
  },
  {
    icon: Building2,
    title: TERMS.academyWorkspace,
    text: 'Run your academy with teachers, students, schedules, and finance.',
  },
  {
    icon: Trophy,
    title: TERMS.competitionWorkspace,
    text: 'Create competitions, manage registrations, assign judges, and publish results.',
  },
  {
    icon: Check,
    title: TERMS.judgeWorkspace,
    text: 'Score performances when assigned — available only with active judge assignments.',
  },
] as const

export function HowYogstraWorksPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight">
            How Yogstra Works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One platform for students and teachers. Teachers unlock workspaces as their involvement grows — no
            separate account types.
          </p>
        </div>
      </section>

      <PublicSection title="Two ways to begin" description="Simple signup. Powerful workspaces when you need them.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {accountTypes.map(({ icon: Icon, title, description, cta, to }) => (
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
        title="Teacher workspaces"
        description="Verified teachers switch between workspaces from one dashboard."
        className="bg-muted/20"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {workspaces.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[20px] border border-border bg-elevated p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent/10 text-accent mb-4">
                <Icon size={20} />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </PublicSection>

      <PublicSection
        title="Platform commission"
        description="Transparent, success-based pricing."
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
            <li className="flex gap-2 items-start">
              <Check size={16} className="text-accent shrink-0 mt-0.5" />
              Free to create an account and explore the platform
            </li>
            <li className="flex gap-2 items-start">
              <Check size={16} className="text-accent shrink-0 mt-0.5" />
              Coaches and academies set their own program fees
            </li>
            <li className="flex gap-2 items-start">
              <Check size={16} className="text-accent shrink-0 mt-0.5" />
              Yogstra takes a small commission on successful paid enrollments
            </li>
            <li className="flex gap-2 items-start">
              <Check size={16} className="text-accent shrink-0 mt-0.5" />
              Competition entry fees include a platform fee when applicable
            </li>
            <li className="flex gap-2 items-start">
              <Check size={16} className="text-accent shrink-0 mt-0.5" />
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
