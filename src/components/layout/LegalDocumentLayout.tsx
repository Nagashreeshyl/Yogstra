import type { ReactNode } from 'react'

interface LegalDocumentLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

export function LegalDocumentLayout({ title, lastUpdated, children }: LegalDocumentLayoutProps) {
  return (
    <article className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full">
      <header className="mb-8 pb-6 border-b border-border">
        <h1 className="font-heading text-2xl sm:text-3xl font-medium text-charcoal mb-2">{title}</h1>
        <p className="text-sm text-charcoal/50">Last updated: {lastUpdated}</p>
      </header>
      <div className="prose-legal space-y-6 text-sm text-charcoal/80 leading-relaxed pb-8">{children}</div>
    </article>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-heading text-lg font-medium text-charcoal mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

LegalDocumentLayout.Section = Section
