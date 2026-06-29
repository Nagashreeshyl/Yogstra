import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import { PublicSection } from '../../components/public/PublicSection'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

const trusted = ['Shiva Yoga Academy', 'Ashtanga Institute Pune', 'Kerala Wellness Collective', 'Delhi Competition League']

const journeys = [
  {
    icon: GraduationCap,
    title: 'Students',
    description: 'Discover teachers, join academies, and compete nationally.',
    to: '/auth/get-started',
  },
  {
    icon: Users,
    title: 'Teachers',
    description: 'Build your practice, manage students, and grow your brand.',
    to: '/auth/teacher/register',
  },
  {
    icon: Building2,
    title: 'Academies',
    description: 'Run batches, finance, attendance, and staff in one place.',
    to: '/auth/get-started',
  },
  {
    icon: Trophy,
    title: 'Competitions',
    description: 'Organize events, manage judges, and publish results.',
    to: '/auth/get-started',
  },
]

const faqs = [
  {
    q: 'Is Yogstra a yoga marketplace?',
    a: 'No. Yogstra is an operating system for academies and competitions — connecting students, teachers, organizers, and judges on one platform.',
  },
  {
    q: 'Can one account access multiple workspaces?',
    a: 'Yes. A teacher can also be an organizer or academy owner. After login, choose the workspace you need.',
  },
  {
    q: 'Do you support live classes and video calls?',
    a: 'Yes. Built-in LiveKit video for live classes and direct message video calls.',
  },
]

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-background to-sidebar-secondary opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <Badge variant="primary" className="mb-6">
            Yogstra V2
          </Badge>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground max-w-3xl leading-tight tracking-tight">
            The Operating System for Yoga Academies &amp; Competitions
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Run your academy, coach students, organize championships, and judge performances — all on one
            premium platform built for modern yoga institutions.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link to="/auth/get-started">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight size={18} className="ml-1" />
              </Button>
            </Link>
            <Link to="/explore">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Platform
              </Button>
            </Link>
          </div>
          <div className="mt-16 rounded-[24px] border border-border bg-elevated/80 p-8 sm:p-12 backdrop-blur-sm">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {[
                { label: 'Academies', value: '120+' },
                { label: 'Teachers', value: '850+' },
                { label: 'Competitions', value: '40+' },
                { label: 'Students', value: '12k+' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-2xl sm:text-3xl font-semibold text-accent">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PublicSection title="Trusted by academies" centered>
        <div className="flex flex-wrap justify-center gap-3">
          {trusted.map((name) => (
            <span
              key={name}
              className="rounded-full border border-border bg-elevated px-4 py-2 text-sm text-muted-foreground"
            >
              {name}
            </span>
          ))}
        </div>
      </PublicSection>

      <PublicSection
        title="Why Yogstra"
        description="One platform for every stakeholder in the yoga ecosystem — not another listing site."
        className="bg-muted/30"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              title: 'Verified ecosystem',
              text: 'Teachers, academies, and competitions go through structured verification.',
            },
            {
              icon: Sparkles,
              title: 'Premium experience',
              text: 'Dashboards, video, payments, and community — unified under V2 design.',
            },
            {
              icon: Trophy,
              title: 'Competition-ready',
              text: 'Organizers, judges, registrations, rankings, and certificates built in.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[20px] border border-border bg-elevated p-6">
              <Icon size={22} className="text-accent mb-4" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </PublicSection>

      <PublicSection title="Built for every journey" description="Choose the path that matches your role." centered>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {journeys.map(({ icon: Icon, title, description, to }) => (
            <Link
              key={title}
              to={to}
              className="rounded-[20px] border border-border bg-elevated p-6 hover:border-accent/40 transition-colors group"
            >
              <Icon size={24} className="text-accent mb-4" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
              <span className="text-sm font-medium text-accent inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                Learn more <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </PublicSection>

      <PublicSection title="Simple pricing" description="Plans for every stage of growth." centered className="bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: 'Student', price: 'Free', desc: 'Explore, book, and compete' },
            { name: 'Teacher', price: '₹499/mo', desc: 'Students, classes, earnings' },
            { name: 'Academy', price: 'Custom', desc: 'Full academy operations' },
          ].map((plan) => (
            <div key={plan.name} className="rounded-[20px] border border-border bg-elevated p-6 text-center">
              <p className="text-sm text-muted-foreground">{plan.name}</p>
              <p className="font-heading text-2xl font-semibold text-foreground mt-2">{plan.price}</p>
              <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/pricing">
            <Button variant="secondary">View full pricing</Button>
          </Link>
        </div>
      </PublicSection>

      <PublicSection title="FAQ" centered>
        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-[16px] border border-border bg-elevated px-5 py-4 group">
              <summary className="font-medium text-foreground cursor-pointer list-none flex justify-between items-center">
                {item.q}
                <span className="text-muted-foreground group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </PublicSection>

      <section className="border-t border-border bg-sidebar-secondary py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-heading text-3xl font-semibold text-sidebar-foreground">
            Ready to run your academy like a modern institution?
          </h2>
          <p className="mt-4 text-sidebar-muted">
            Join Yogstra — the platform built for yoga academies and competitions.
          </p>
          <Link to="/auth/get-started" className="inline-block mt-8">
            <Button size="lg">Get Started Free</Button>
          </Link>
        </div>
      </section>
    </>
  )
}
