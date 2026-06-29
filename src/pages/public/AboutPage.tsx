import { PublicSection } from '../../components/public/PublicSection'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'

export function AboutPage() {
  return (
    <PageContainer width="wide" className="py-10 sm:py-14">
      <PageHeader
        title="About Yogstra"
        description="We're building the operating system for yoga academies and competitions."
        className="mb-8"
      />

      <PublicSection title="Mission" className="!py-8 !px-0">
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          Yogstra connects students, teachers, academies, organizers, and judges on one platform — so institutions
          can focus on teaching and competition excellence, not fragmented tools.
        </p>
      </PublicSection>

      <PublicSection title="Vision" className="!py-8 !px-0 bg-muted/30 rounded-[20px] !mx-0 px-6 sm:px-8">
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          A world where every yoga academy runs like a modern institution: verified teachers, structured programs,
          live classes, and national-level competitions — all in one premium experience.
        </p>
      </PublicSection>

      <PublicSection title="Our story" className="!py-8 !px-0">
        <p className="text-muted-foreground leading-relaxed max-w-3xl mb-4">
          Yogstra started when academy owners told us they were juggling spreadsheets, WhatsApp groups, and
          disconnected payment tools. Teachers wanted visibility. Students wanted trust. Organizers wanted
          professional competition infrastructure.
        </p>
        <p className="text-muted-foreground leading-relaxed max-w-3xl">
          V2 is our answer: one design system, one auth model, and one platform for every stakeholder in the
          yoga ecosystem.
        </p>
      </PublicSection>

      <PublicSection title="Team" className="!py-8 !px-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {['Product & Platform', 'Academy Success', 'Competition Ops'].map((role) => (
            <div key={role} className="rounded-[16px] border border-border bg-elevated p-6 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted mb-4" />
              <p className="font-medium text-foreground">{role}</p>
              <p className="text-sm text-muted-foreground mt-1">Yogstra Core Team</p>
            </div>
          ))}
        </div>
      </PublicSection>
    </PageContainer>
  )
}
