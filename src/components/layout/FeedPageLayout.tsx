import type { ReactNode } from 'react'

interface FeedPageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
}

/** Centered feed + optional right rail — V2 tokens */
export function FeedPageLayout({ children, sidebar }: FeedPageLayoutProps) {
  return (
    <div className="min-h-full bg-background py-6 px-4 sm:px-6">
      <div className="mx-auto flex max-w-[935px] justify-center gap-8 xl:gap-16">
        <main className="w-full max-w-[470px] shrink-0">{children}</main>
        {sidebar && (
          <aside className="sticky top-6 hidden w-[293px] shrink-0 self-start lg:block">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}

interface SettingsPageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
}

/** Settings / profile edit — wider center column + right rail — V2 tokens */
export function SettingsPageLayout({ children, sidebar }: SettingsPageLayoutProps) {
  return (
    <div className="min-h-full bg-background py-8 px-4 sm:px-6">
      <div className="mx-auto flex max-w-[900px] justify-center gap-10 xl:gap-14">
        <main className="w-full max-w-[560px] shrink-0">{children}</main>
        {sidebar && (
          <aside className="sticky top-6 hidden w-[280px] shrink-0 self-start md:block">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
