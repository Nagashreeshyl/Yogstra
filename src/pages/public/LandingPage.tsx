import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import { PublicSection } from '../../components/public/PublicSection'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

const showcases = {
  coaches: [
    { name: 'Priya Sharma', style: 'Iyengar Yoga', location: 'Mumbai', rating: 4.9, students: 340 },
    { name: 'Amit Kumar', style: 'Ashtanga', location: 'Pune', rating: 4.8, students: 210 },
    { name: 'Meera Patel', style: 'Competition Prep', location: 'Delhi', rating: 5.0, students: 156 },
  ],
  academies: [
    { name: 'Shanti Yoga Academy', location: 'Bangalore', programs: 8 },
    { name: 'Kaivalyadhama Institute', location: 'Pune', programs: 12 },
    { name: 'Kerala Wellness Collective', location: 'Kochi', programs: 6 },
  ],
  competitions: [
    { name: 'National Yoga Championship 2026', date: 'Aug 15', venue: 'New Delhi' },
    { name: 'State Level Championship', date: 'Jul 20', venue: 'Mumbai' },
  ],
}

const testimonials = [
  {
    quote: 'Yogstra transformed how we run our academy. Batches, teachers, and competitions — all in one place.',
    author: 'Rajesh K.',
    role: 'Academy Owner',
  },
  {
    quote: 'I found my coach, joined a foundation program, and competed at state level within six months.',
    author: 'Ananya S.',
    role: 'Student',
  },
  {
    quote: 'Managing registrations and judges for our championship has never been this smooth.',
    author: 'Dr. Lakshmi M.',
    role: 'Competition Organizer',
  },
]

const faqs = [
  {
    q: 'What is Yogstra?',
    a: 'Yogstra is the operating system for yoga academies, coaches, students, and competitions — connecting every stakeholder on one premium platform.',
  },
  {
    q: 'Is Yogstra a marketplace?',
    a: 'No. Yogstra is a professional training platform where students join programs, coaches run their practice, and academies manage operations.',
  },
  {
    q: 'How does Yogstra make money?',
    a: 'Yogstra earns a small platform commission on successful paid enrollments and competition registrations. There are no monthly subscription fees.',
  },
  {
    q: 'Can I attend live online classes?',
    a: 'Yes. Built-in live online classes and instant messaging connect you directly with your coach.',
  },
  {
    q: 'Can one account access multiple workspaces?',
    a: 'Yes. A coach can also run an academy or serve as a competition judge. After login, you go directly to your primary workspace.',
  },
]

export function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-background to-sidebar-secondary opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
          <Badge variant="primary" className="mb-6">
            Premium Yoga Platform
          </Badge>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground max-w-3xl leading-tight tracking-tight">
            The Operating System for Yoga Academies, Teachers, Students and Competitions
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Discover coaches, join structured programs, run academies, and host world-class competitions —
            everything yoga training needs, in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link to="/auth/get-started">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
                <ArrowRight size={18} className="ml-1" />
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Discover Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <PublicSection title="One platform. Every stakeholder." description="Yogstra connects the entire yoga ecosystem." centered>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { icon: GraduationCap, label: 'Students', desc: 'Learn & compete' },
            { icon: Users, label: 'Coaches', desc: 'Teach & grow' },
            { icon: Building2, label: 'Academies', desc: 'Manage & scale' },
            { icon: Trophy, label: 'Competitions', desc: 'Organize & judge' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-[20px] border border-border bg-elevated p-6 text-center">
              <Icon size={24} className="text-accent mx-auto mb-3" />
              <p className="font-heading font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </PublicSection>

      {/* Why Yogstra */}
      <PublicSection title="Why Yogstra" description="Built for professional yoga institutions, not another listing site." className="bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: 'Verified ecosystem', text: 'Coaches, academies, and competitions go through structured verification.' },
            { icon: Sparkles, title: 'Premium experience', text: 'Programs, live classes, secure payments, and community — unified under one design.' },
            { icon: Trophy, title: 'Competition-ready', text: 'Organizers, judges, registrations, rankings, and certificates built in.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[20px] border border-border bg-elevated p-6">
              <Icon size={22} className="text-accent mb-4" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </PublicSection>

      {/* Coach Showcase */}
      <PublicSection title="Featured Coaches" description="Verified coaches ready to guide your journey.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {showcases.coaches.map((coach) => (
            <div key={coach.name} className="rounded-[20px] border border-border bg-elevated p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center font-heading font-semibold text-accent">
                  {coach.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{coach.name}</p>
                  <p className="text-xs text-muted-foreground">{coach.style}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star size={12} className="fill-accent text-accent" />
                  {coach.rating}
                </span>
                <span>{coach.students} students</span>
                <span>{coach.location}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/teachers">
            <Button variant="secondary">Discover Coaches</Button>
          </Link>
        </div>
      </PublicSection>

      {/* Academy Showcase */}
      <PublicSection title="Featured Academies" description="Professional institutions on Yogstra." className="bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {showcases.academies.map((academy) => (
            <div key={academy.name} className="rounded-[20px] border border-border bg-elevated p-6">
              <Building2 size={22} className="text-accent mb-3" />
              <p className="font-heading font-semibold text-foreground">{academy.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{academy.location}</p>
              <p className="text-xs text-accent mt-2">{academy.programs} programs</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/academies">
            <Button variant="secondary">Browse Academies</Button>
          </Link>
        </div>
      </PublicSection>

      {/* Competition Showcase */}
      <PublicSection title="Upcoming Competitions" description="Register, prepare, and compete.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
          {showcases.competitions.map((comp) => (
            <div key={comp.name} className="rounded-[20px] border border-border bg-elevated p-6 flex gap-4">
              <Trophy size={22} className="text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{comp.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{comp.date} · {comp.venue}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/competitions">
            <Button variant="secondary">View Competitions</Button>
          </Link>
        </div>
      </PublicSection>

      {/* Community */}
      <PublicSection title="Community" description="Share progress, celebrate achievements, stay connected." className="bg-muted/30" centered>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8">
          An Instagram-like feed where coaches share insights, students celebrate milestones, and academies post updates.
        </p>
        <Link to="/community">
          <Button variant="secondary">Join Community</Button>
        </Link>
      </PublicSection>

      {/* Testimonials */}
      <PublicSection title="Trusted by the yoga community" centered>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <blockquote key={t.author} className="rounded-[20px] border border-border bg-elevated p-6">
              <p className="text-sm text-muted-foreground leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              <footer className="mt-4">
                <p className="text-sm font-medium text-foreground">{t.author}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </PublicSection>

      {/* FAQ */}
      <PublicSection title="Frequently asked questions" centered className="bg-muted/30">
        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((item) => (
            <details key={item.q} className="rounded-[16px] border border-border bg-elevated px-5 py-4 group">
              <summary className="font-medium text-foreground cursor-pointer list-none flex justify-between items-center">
                {item.q}
                <span className="text-muted-foreground group-open:rotate-45 transition-transform text-lg">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </PublicSection>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground">
            Ready to begin your journey?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Join thousands of students, coaches, and academies on the platform built for modern yoga training.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/auth/get-started">
              <Button size="lg">
                Get Started
                <ArrowRight size={18} className="ml-1" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="secondary" size="lg">
                How Yogstra Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
