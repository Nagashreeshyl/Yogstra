import type { ReactNode } from 'react'
import { PageContainer } from '../shell/PageContainer'
import { PageHeader } from '../shell/PageHeader'

interface LegalDocumentLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

export function LegalDocumentLayout({ title, lastUpdated, children }: LegalDocumentLayoutProps) {
  return (
    <PageContainer width="narrow">
      <article>
        <PageHeader
          title={title}
          description={`Last updated: ${lastUpdated}`}
          className="mb-8 pb-6 border-b border-border"
        />
        <div className="prose-legal space-y-6 text-sm text-muted-foreground leading-relaxed pb-8">
          {children}
        </div>
      </article>
    </PageContainer>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-lg font-semibold text-foreground mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

LegalDocumentLayout.Section = Section
