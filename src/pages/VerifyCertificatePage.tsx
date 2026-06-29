import { useParams } from 'react-router-dom'
import { ShieldCheck, ShieldX } from 'lucide-react'
import { useAsyncData } from '../hooks/useAsyncData'
import { verifyCertificateByQrToken } from '../services/certificateService'
import { PageContainer } from '../components/shell/PageContainer'
import { LoadingSkeleton } from '../components/shell/LoadingSkeleton'
import { ErrorState } from '../components/shell/ErrorState'
import { Badge } from '../components/ui/Badge'

export function VerifyCertificatePage() {
  const { token } = useParams<{ token: string }>()

  const { data, loading, error } = useAsyncData(
    () =>
      token
        ? verifyCertificateByQrToken(token)
        : Promise.reject(new Error('Missing verification token')),
    [token],
    { enabled: Boolean(token) },
  )

  if (loading) return <LoadingSkeleton />
  if (error || !data) {
    return (
      <PageContainer width="narrow">
        <ErrorState title="Verification failed" message={error ?? 'Certificate not found.'} />
      </PageContainer>
    )
  }

  const { valid, certificate } = data

  return (
    <PageContainer width="narrow">
      <div className="mx-auto max-w-lg py-12 text-center">
        {valid ? (
          <ShieldCheck size={48} className="mx-auto text-emerald-600 mb-4" aria-hidden />
        ) : (
          <ShieldX size={48} className="mx-auto text-destructive mb-4" aria-hidden />
        )}
        <h1 className="text-2xl font-semibold mb-2">
          {valid ? 'Certificate verified' : 'Certificate invalid'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {valid
            ? 'This certificate was issued by Yogstra and is authentic.'
            : certificate?.revokedAt
              ? 'This certificate has been revoked.'
              : 'We could not verify this certificate.'}
        </p>

        {certificate && (
          <div className="rounded-[16px] border border-border bg-card p-6 text-left space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{certificate.title}</p>
              <Badge variant={valid ? 'verified' : 'default'}>{certificate.status}</Badge>
            </div>
            {certificate.competitionName && (
              <p className="text-sm text-muted-foreground">{certificate.competitionName}</p>
            )}
            {certificate.recipientName && (
              <p className="text-sm">
                <span className="text-muted-foreground">Recipient: </span>
                {certificate.recipientName}
              </p>
            )}
            {certificate.issuedAt && (
              <p className="text-sm">
                <span className="text-muted-foreground">Issued: </span>
                {new Date(certificate.issuedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
            {valid && certificate.verificationUrl && (
              <p className="text-xs text-muted-foreground break-all pt-2 border-t border-border">
                Token: {token}
              </p>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
