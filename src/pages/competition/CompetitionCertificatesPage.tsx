import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchUserCertificates, verifyCertificateByQrToken } from '../../services/certificateService'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { CertificateCard } from '../../components/student/competition/CertificateCard'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

export function CompetitionCertificatesPage() {
  const { user } = useApp()
  const userId = user?.id ?? ''
  const [token, setToken] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const [verifyResult, setVerifyResult] = useState<
    Awaited<ReturnType<typeof verifyCertificateByQrToken>> | null
  >(null)

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? fetchUserCertificates(userId)
        : Promise.reject(new Error('Sign in to view your certificates')),
    [userId],
    { enabled: Boolean(userId) },
  )

  const handleVerify = async () => {
    const trimmed = token.trim()
    if (!trimmed) return

    setVerifying(true)
    setVerifyError(null)
    setVerifyResult(null)

    try {
      const result = await verifyCertificateByQrToken(trimmed)
      setVerifyResult(result)
    } catch {
      setVerifyError('Verification failed. Check the token and try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleShare = async (title: string, url: string | null) => {
    const shareUrl = url ?? window.location.href
    if (navigator.share) {
      await navigator.share({ title, url: shareUrl })
    } else {
      await navigator.clipboard.writeText(shareUrl)
    }
  }

  if (!user) {
    return (
      <ErrorState
        title="Sign in required"
        message="Log in to view and manage your competition certificates."
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Certificates"
        description="Download your certificates or verify authenticity with a QR token."
      />

      <section className="mb-8 rounded-lg border border-border p-4 sm:p-5" aria-labelledby="verify-heading">
        <h2 id="verify-heading" className="mb-3 font-heading text-lg font-semibold">
          Verify certificate
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Enter the verification token from a certificate QR code.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste verification token…"
            className="min-h-[44px] flex-1 rounded-lg border border-border bg-elevated px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Button onClick={() => void handleVerify()} disabled={verifying || !token.trim()}>
            {verifying ? 'Verifying…' : 'Verify'}
          </Button>
        </div>

        {verifyError && (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {verifyError}
          </p>
        )}

        {verifyResult && (
          <div className="mt-4 rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={verifyResult.valid ? 'verified' : 'default'}>
                {verifyResult.valid ? 'Valid' : 'Invalid'}
              </Badge>
              {verifyResult.certificate?.title && (
                <span className="text-sm font-medium">{verifyResult.certificate.title}</span>
              )}
            </div>
            {verifyResult.certificate && (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="capitalize">
                    {verifyResult.certificate.certificateType.replace(/_/g, ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="capitalize">{verifyResult.certificate.status}</dd>
                </div>
                {verifyResult.certificate.issuedAt && (
                  <div>
                    <dt className="text-muted-foreground">Issued</dt>
                    <dd>{new Date(verifyResult.certificate.issuedAt).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            )}
            {!verifyResult.valid && verifyResult.certificate?.revokedAt && (
              <p className="mt-2 text-sm text-muted-foreground">This certificate has been revoked.</p>
            )}
          </div>
        )}
      </section>

      {loading ? (
        <LoadingSkeleton variant="page" />
      ) : error ? (
        <ErrorState
          title="Could not load certificates"
          message={error}
          onRetry={() => void refetch()}
        />
      ) : !data?.length ? (
        <EmptyState
          title="No certificates yet"
          description="Certificates appear here after you participate in competitions."
        />
      ) : (
        <div className="space-y-4">
          {data.map((cert) => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              onShare={() => void handleShare(cert.title, cert.verificationUrl)}
            />
          ))}
        </div>
      )}
    </>
  )
}
