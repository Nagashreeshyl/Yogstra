import { Link } from 'react-router-dom'

const legalLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-of-service', label: 'Terms of Service' },
  { to: '/refund-policy', label: 'Refund Policy' },
]

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-elevated px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-muted-foreground">
        <p>© 2026 Yogstra. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {legalLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
