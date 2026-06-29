import { Link } from 'react-router-dom'
import { useState } from 'react'
import { footerNav } from '../public/publicNavLinks'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function PublicFooter() {
  const [email, setEmail] = useState('')

  return (
    <footer className="mt-auto border-t border-border bg-sidebar-secondary text-sidebar-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-6 lg:gap-10">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="font-heading text-xl font-semibold text-sidebar-foreground">
              Yogstra
            </Link>
            <p className="mt-3 text-sm text-sidebar-muted leading-relaxed max-w-xs">
              The Operating System for Yoga Academies &amp; Competitions.
            </p>
            <form
              className="mt-6 flex flex-col sm:flex-row gap-2 max-w-sm"
              onSubmit={(e) => {
                e.preventDefault()
                setEmail('')
              }}
            >
              <Input
                type="email"
                placeholder="Email for updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Newsletter email"
                className="bg-sidebar border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted"
              />
              <Button type="submit" size="sm" className="shrink-0">
                Subscribe
              </Button>
            </form>
          </div>

          <FooterColumn title="Company" links={footerNav.company} />
          <FooterColumn title="Platform" links={footerNav.platform} />
          <FooterColumn title="Resources" links={footerNav.resources} />
          <FooterColumn title="Legal" links={footerNav.legal} />
        </div>

        <div className="mt-12 pt-8 border-t border-sidebar-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-sidebar-muted">
          <p>© {new Date().getFullYear()} Yogstra. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <a href="mailto:hello@yogstra.com" className="hover:text-sidebar-foreground transition-colors">
              hello@yogstra.com
            </a>
            <span aria-hidden>·</span>
            <Link to="/contact" className="hover:text-sidebar-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly { to: string; label: string }[]
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-sidebar-muted mb-3">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
