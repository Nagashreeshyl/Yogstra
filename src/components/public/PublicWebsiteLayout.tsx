import { useState, type ReactNode } from 'react'
import { PublicTopNav } from './PublicTopNav'
import { PublicMobileNav } from './PublicMobileNav'
import { PublicFooter } from '../layout/PublicFooter'

type PublicWebsiteLayoutProps = {
  children: ReactNode
}

export function PublicWebsiteLayout({ children }: PublicWebsiteLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="public-site flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-[12px] focus:bg-elevated focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent/40"
      >
        Skip to main content
      </a>

      <PublicTopNav mobileOpen={mobileOpen} onOpenMobile={() => setMobileOpen((v) => !v)} />
      <PublicMobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main id="main-content" className="flex flex-1 flex-col">
        {children}
      </main>

      <PublicFooter />
    </div>
  )
}
