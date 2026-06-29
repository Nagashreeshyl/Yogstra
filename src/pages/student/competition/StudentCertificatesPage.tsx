import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentCertificatesPage } from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { EmptyState } from '../../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { CertificateCard } from '../../../components/student/competition/CertificateCard'

export function StudentCertificatesPage() {
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? fetchStudentCertificatesPage(userId)
        : Promise.reject(new Error('Not signed in')),
    [userId],
    { enabled: Boolean(userId) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error) {
    return (
      <ErrorState
        title="Could not load certificates"
        message={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No certificates yet"
        description="Earn certificates by participating in competitions."
      />
    )
  }

  const handleShare = async (title: string, url: string | null) => {
    const shareUrl = url ?? window.location.href
    if (navigator.share) {
      await navigator.share({ title, url: shareUrl })
    } else {
      await navigator.clipboard.writeText(shareUrl)
    }
  }

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Your earned certificates with QR verification."
      />
      <div className="space-y-4">
        {data.map((cert) => (
          <CertificateCard
            key={cert.id}
            certificate={cert}
            onShare={() => void handleShare(cert.title, cert.verificationUrl)}
          />
        ))}
      </div>
    </>
  )
}
