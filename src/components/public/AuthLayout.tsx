import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthLayoutProps = {
  children: ReactNode
  title?: string
  description?: string
  /** wide = onboarding journey picker; narrow = login/signup forms */
  variant?: 'narrow' | 'wide'
}

export function AuthLayout({ children, title, description, variant = 'narrow' }: AuthLayoutProps) {
  const isWide = variant === 'wide'

  return (
    <div className="public-site min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto max-w-[1280px]">
          <Link to="/" className="font-heading text-xl font-semibold text-foreground">
            Yogstra
          </Link>
        </div>
      </header>

      <main className={`flex flex-1 flex-col items-center px-4 sm:px-6 lg:px-8 ${isWide ? 'py-16 sm:py-24' : 'justify-center py-10 sm:py-14'}`}>
        <div className={`w-full ${isWide ? 'max-w-[1280px]' : 'max-w-md'}`}>
          {(title || description) && (
            <div className={`mb-10 ${isWide ? 'text-center max-w-2xl mx-auto' : 'text-center'}`}>
              {title && (
                <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground">{title}</h1>
              )}
              {description && <p className="mt-3 text-base text-muted-foreground">{description}</p>}
            </div>
          )}
          {children}
        </div>
      </main>

      <footer className="mt-auto border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">
          ← Back to Home
        </Link>
      </footer>
    </div>
  )
}
