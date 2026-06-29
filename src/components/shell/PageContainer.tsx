import type { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  /** full = no max-width constraint */
  width?: 'default' | 'narrow' | 'wide' | 'full'
  className?: string
}

const widthClasses = {
  default: 'max-w-[1280px]',
  narrow: 'max-w-3xl',
  wide: 'max-w-[1280px]',
  full: 'max-w-none',
}

export function PageContainer({
  children,
  width = 'default',
  className = '',
}: PageContainerProps) {
  return (
    <div
      className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${widthClasses[width]} ${className}`}
    >
      {children}
    </div>
  )
}
