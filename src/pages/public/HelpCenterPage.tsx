import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Search } from 'lucide-react'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { Input } from '../../components/ui/Input'
import { PUBLIC_FAQS } from '../../constants/publicFaqs'

type HelpArticle = {
  id: string
  title: string
  content: React.ReactNode
}

const articles: HelpArticle[] = [
  {
    id: 'creating-account',
    title: 'Creating an account',
    content: (
      <>
        <p>Visit the Yogstra homepage and click <strong>Get Started</strong>. Choose student or teacher, then complete the registration form.</p>
        <p className="mt-3">Teachers unlock Academy, Competition, and Judge workspaces after verification — no separate account types.</p>
        <p className="mt-3">
          <Link to="/auth/get-started" className="text-accent hover:underline font-medium">Get Started →</Link>
        </p>
      </>
    ),
  },
  {
    id: 'finding-coach',
    title: 'Finding a coach',
    content: (
      <>
        <p>Browse verified coaches on the Discover page or use <strong>Find Coaches</strong> to filter by style, location, and specialization. Each coach profile shows programs, pricing, experience, and student reviews.</p>
        <p className="mt-3">When you find a coach you like, view their profile and use <strong>Book Trial</strong> or <strong>Enroll in Program</strong> to get started. You can also message them directly.</p>
        <p className="mt-3">
          <Link to="/teachers" className="text-accent hover:underline font-medium">Browse Coaches →</Link>
        </p>
      </>
    ),
  },
  {
    id: 'joining-academy',
    title: 'Joining an academy',
    content: (
      <>
        <p>Academies on Yogstra manage batches, teachers, and student enrollments. Browse active academies on the Discover page or visit an academy profile to learn about their programs.</p>
        <p className="mt-3">To create an academy, sign up as a teacher and enable your <strong>Academy workspace</strong> from the dashboard after verification.</p>
        <p className="mt-3">
          <Link to="/academies" className="text-accent hover:underline font-medium">Browse Academies →</Link>
        </p>
      </>
    ),
  },
  {
    id: 'programs',
    title: 'Programs',
    content: (
      <>
        <p>Coaches offer structured programs including personal coaching (1-on-1), training batches (group), and competition coaching. Program details and pricing are listed on each coach profile.</p>
        <p className="mt-3">After enrolling, track your active programs from your student dashboard under <strong>My Programs</strong> and <strong>Classes</strong>.</p>
      </>
    ),
  },
  {
    id: 'competitions',
    title: 'Competitions',
    content: (
      <>
        <p>Yogstra hosts yoga competitions with registration, judging, scoring, and certificate generation. Browse upcoming competitions on the Discover page or your student dashboard.</p>
        <p className="mt-3">Students can register for competitions through their dashboard. Teachers create competitions from the Competition workspace.</p>
        <p className="mt-3">
          <Link to="/competitions" className="text-accent hover:underline font-medium">View Competitions →</Link>
        </p>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Payments',
    content: (
      <>
        <p>Class fees are collected securely at the time of booking through our integrated payment partner. All prices are displayed in Indian Rupees (INR).</p>
        <p className="mt-3">Refund eligibility depends on attendance and timing. See our refund policy for full details.</p>
        <p className="mt-3">
          <Link to="/refund-policy" className="text-accent hover:underline font-medium">Refund Policy →</Link>
        </p>
      </>
    ),
  },
  {
    id: 'certificates',
    title: 'Certificates',
    content: (
      <>
        <p>Competition certificates are issued digitally after events conclude. Students can view and download certificates from their competition dashboard.</p>
        <p className="mt-3">Each certificate includes a verification token. Anyone can verify authenticity by scanning the QR code or visiting the verification link.</p>
      </>
    ),
  },
  {
    id: 'community',
    title: 'Community',
    content: (
      <>
        <p>The Yogstra community feed lets students share practice updates, progress photos, and achievements. Coaches can provide feedback through comments.</p>
        <p className="mt-3">Community content must follow our content policy. Inappropriate posts may be removed by moderators.</p>
        <p className="mt-3">
          <Link to="/terms-of-service" className="text-accent hover:underline font-medium">Content Policy →</Link>
        </p>
      </>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy',
    content: (
      <>
        <p>We collect only the data needed to operate Yogstra — account details, booking records, and communications. We never sell your personal information.</p>
        <p className="mt-3">You can request access, correction, or deletion of your data by contacting our support team.</p>
        <p className="mt-3">
          <Link to="/privacy-policy" className="text-accent hover:underline font-medium">Privacy Policy →</Link>
        </p>
      </>
    ),
  },
  {
    id: 'terms',
    title: 'Terms',
    content: (
      <>
        <p>By using Yogstra you agree to our Terms of Service, including platform usage rules, teacher verification requirements, payment terms, and content guidelines.</p>
        <p className="mt-3">
          <Link to="/terms-of-service" className="text-accent hover:underline font-medium">Terms of Service →</Link>
        </p>
      </>
    ),
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    content: (
      <>
        <p>Need help? Our support team is available by email for account issues, booking disputes, verification questions, and general inquiries.</p>
        <p className="mt-3">
          <a href="mailto:support@yogstra.com" className="inline-flex items-center gap-2 text-accent hover:underline font-medium">
            <Mail size={16} />
            support@yogstra.com
          </a>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">We typically respond within 1–2 business days.</p>
      </>
    ),
  },
]

const faqs = [...PUBLIC_FAQS]

export function HelpCenterPage() {
  const [query, setQuery] = useState('')

  const filteredArticles = articles.filter(
    (a) => !query || a.title.toLowerCase().includes(query.toLowerCase()),
  )
  const filteredFaqs = faqs.filter(
    (f) => !query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <PageContainer width="default" className="py-16 sm:py-24">
      <PageHeader
        title="Help Center"
        description="Guides, FAQs, and support resources for Yogstra."
        className="mb-10"
      />

      <div className="relative max-w-xl mb-12">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search help articles…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
          aria-label="Search help"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {filteredArticles.map((article) => (
          <details key={article.id} id={article.id} className="rounded-[20px] border border-border bg-elevated group open:shadow-md transition-shadow">
            <summary className="font-heading text-base font-semibold text-foreground cursor-pointer px-6 py-5 list-none flex items-center justify-between">
              {article.title}
              <span className="text-muted-foreground text-lg group-open:rotate-45 transition-transform" aria-hidden>+</span>
            </summary>
            <div className="px-6 pb-6 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
              {article.content}
            </div>
          </details>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <p className="text-sm text-muted-foreground mb-12">No articles match your search. Try different keywords or contact support.</p>
      )}

      {filteredFaqs.length > 0 && (
        <>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-3xl">
            {filteredFaqs.map((item) => (
              <details key={item.q} className="rounded-[16px] border border-border bg-elevated px-5 py-4">
                <summary className="font-medium text-foreground cursor-pointer">{item.q}</summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  )
}
