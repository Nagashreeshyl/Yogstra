import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthLayoutProps = {
  children: ReactNode
  title?: string
  description?: string
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="public-site min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border px-4 sm:px-6 py-4">
        <Link to="/" className="font-heading text-xl font-semibold text-foreground">
          Yogstra
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md">
          {(title || description) && (
            <div className="mb-8 text-center">
              {title && (
                <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground">{title}</h1>
              )}
              {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
            </div>
          )}
          {children}
        </div>
      </main>

      <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">
          ← Back to Home
        </Link>
      </footer>
    </div>
  )
}
