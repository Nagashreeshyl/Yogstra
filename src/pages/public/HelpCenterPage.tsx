import { useState } from 'react'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { Input } from '../../components/ui/Input'

const categories = [
  { title: 'Getting started', items: ['Creating an account', 'Choosing your journey', 'Workspace picker'] },
  { title: 'Students', items: ['Finding teachers', 'Booking classes', 'Competition registration'] },
  { title: 'Teachers', items: ['Verification process', 'Live classes', 'Earnings & payouts'] },
  { title: 'Academies', items: ['Creating an academy', 'Batches & attendance', 'Inviting teachers'] },
]

const faqs = [
  { q: 'How do I reset my password?', a: 'Use Forgot Password on the login page. A reset link will be sent to your email.' },
  { q: 'Can I be both a teacher and organizer?', a: 'Yes. After login, use the workspace picker to switch between dashboards.' },
  { q: 'How does teacher verification work?', a: 'Submit your profile and certificates. An admin reviews and approves within 48 hours.' },
]

export function HelpCenterPage() {
  const [query, setQuery] = useState('')

  const filteredFaqs = faqs.filter(
    (f) => !query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <PageContainer width="wide" className="py-10 sm:py-14">
      <PageHeader
        title="Help Center"
        description="Search guides, FAQs, and support resources."
        className="mb-8"
      />

      <Input
        placeholder="Search help articles…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xl mb-12"
        aria-label="Search help"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        {categories.map((cat) => (
          <div key={cat.title} className="rounded-[16px] border border-border bg-elevated p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">{cat.title}</h3>
            <ul className="space-y-2">
              {cat.items.map((item) => (
                <li key={item} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="font-heading text-xl font-semibold text-foreground mb-4">FAQs</h2>
      <div className="space-y-3 max-w-3xl">
        {filteredFaqs.map((item) => (
          <details key={item.q} className="rounded-[16px] border border-border bg-elevated px-5 py-4">
            <summary className="font-medium text-foreground cursor-pointer">{item.q}</summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </PageContainer>
  )
}
