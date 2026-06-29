import type { ReactNode } from 'react'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { PageContainer } from '../shell/PageContainer'
import { ErrorState } from '../shell/ErrorState'
import { LoadingSkeleton } from '../shell/LoadingSkeleton'
import { AcademyCreateSection } from '../../pages/academy/AcademyCreateSection'

/** Ensures academy context is ready before rendering academy sub-pages. */
export function AcademyPageBoundary({ children }: { children: ReactNode }) {
  const { academyId, academies, loading, error, refetch } = useAcademyContext()

  if (loading) return <LoadingSkeleton />

  if (error) {
    return (
      <PageContainer width="wide">
        <ErrorState message={error} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  if (!academies.length) return <AcademyCreateSection />

  if (!academyId) return <LoadingSkeleton />

  return <>{children}</>
}
