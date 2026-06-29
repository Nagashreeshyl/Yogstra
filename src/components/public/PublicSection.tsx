import type { ReactNode } from 'react'

type PublicSectionProps = {
  id?: string
  title?: string
  description?: string
  children: ReactNode
  className?: string
  centered?: boolean
}

export function PublicSection({
  id,
  title,
  description,
  children,
  className = '',
  centered = false,
}: PublicSectionProps) {
  return (
    <section id={id} className={`py-14 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <div className={`mb-10 max-w-2xl ${centered ? 'mx-auto text-center' : ''}`}>
            {title && (
              <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
