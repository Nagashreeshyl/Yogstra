import { Link } from 'react-router-dom'
import { footerNav } from '../public/publicNavLinks'

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-sidebar-secondary text-sidebar-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-5 lg:gap-10">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="font-heading text-xl font-semibold text-sidebar-foreground">
              Yogstra
            </Link>
            <p className="mt-3 text-sm text-sidebar-muted leading-relaxed max-w-sm">
              The Operating System for Yoga Academies, Teachers, Students and Competitions.
            </p>
          </div>

          <FooterColumn title="Discover" links={footerNav.platform} />
          <FooterColumn title="Company" links={footerNav.company} />
          <FooterColumn title="Legal" links={footerNav.legal} />
        </div>

        <div className="mt-12 pt-8 border-t border-sidebar-border text-sm text-sidebar-muted">
          <p>© {new Date().getFullYear()} Yogstra. All rights reserved.</p>
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
