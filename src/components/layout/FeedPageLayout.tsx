import type { ReactNode } from 'react'

interface FeedPageLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
}

/** Instagram-style centered feed + optional right rail */
export function FeedPageLayout({ children, sidebar }: FeedPageLayoutProps) {
  return (
    <div className="min-h-full bg-surface py-6 px-4 sm:px-6">
      <div className="mx-auto flex max-w-[935px] gap-8 xl:gap-16 justify-center">
        <main className="w-full max-w-[470px] shrink-0">{children}</main>
        {sidebar && (
          <aside className="hidden lg:block w-[293px] shrink-0 sticky top-6 self-start">
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

/** Settings / profile edit — wider center column + right rail */
export function SettingsPageLayout({ children, sidebar }: SettingsPageLayoutProps) {
  return (
    <div className="min-h-full bg-surface py-8 px-4 sm:px-6">
      <div className="mx-auto flex max-w-[900px] gap-10 xl:gap-14 justify-center">
        <main className="w-full max-w-[560px] shrink-0">{children}</main>
        {sidebar && (
          <aside className="hidden md:block w-[280px] shrink-0 sticky top-6 self-start">
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
