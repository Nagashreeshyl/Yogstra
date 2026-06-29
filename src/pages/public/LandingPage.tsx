import { lazy, Suspense } from 'react'
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
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchLandingPageData } from '../../services/landingService'
import { PublicSection } from '../../components/public/PublicSection'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LandingHeroStats } from '../../components/public/landing/LandingHeroStats'
import { LandingSectionsSkeleton } from '../../components/public/landing/LandingSectionsSkeleton'

const LandingLiveSections = lazy(() =>
  import('../../components/public/landing/LandingLiveSections').then((m) => ({
    default: m.LandingLiveSections,
  })),
)

import { PUBLIC_FAQS } from '../../constants/publicFaqs'

const faqs = PUBLIC_FAQS.slice(0, 6)

export function LandingPage() {
  const { data, loading, error } = useAsyncData(() => fetchLandingPageData(), [])

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-background to-sidebar-secondary opacity-90" />
        <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-32">
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

          <LandingHeroStats stats={data?.stats ?? null} loading={loading} />
        </div>
      </section>

      {/* Platform Overview */}
      <PublicSection title="One platform. Every stakeholder." description="Yogstra connects the entire yoga ecosystem." centered>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
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
            { icon: Trophy, title: 'Competition-ready', text: 'Competitions, judge assignments, registrations, rankings, and certificates built in.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[20px] border border-border bg-elevated p-6">
              <Icon size={22} className="text-accent mb-4" />
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </PublicSection>

      {/* Live data sections — code-split and deferred */}
      <Suspense fallback={<LandingSectionsSkeleton />}>
        {loading ? (
          <LandingSectionsSkeleton />
        ) : error ? (
          <PublicSection title="Platform content" centered>
            <p className="text-sm text-muted-foreground text-center">
              Some content could not be loaded. Please refresh the page.
            </p>
          </PublicSection>
        ) : data ? (
          <LandingLiveSections data={data} />
        ) : null}
      </Suspense>

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
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-foreground">
            Ready to begin your journey?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Join students, coaches, and academies on the platform built for modern yoga training.
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
