import { Award, Download, QrCode, Share2 } from 'lucide-react'
import type { CompetitionCertificate } from '../../../domain/competition/models'

interface CertificateCardProps {
  certificate: CompetitionCertificate
  competitionName?: string
  onShare?: () => void
}

export function CertificateCard({ certificate, competitionName, onShare }: CertificateCardProps) {
  const issued = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <article className="flex flex-col overflow-hidden rounded-[16px] border border-border bg-elevated shadow-sm sm:flex-row">
      <div className="flex items-center justify-center bg-gradient-to-br from-accent/20 to-primary/10 p-6 sm:w-36">
        <Award className="h-12 w-12 text-accent" strokeWidth={1.5} aria-hidden />
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {certificate.certificateType.replace(/_/g, ' ')}
        </p>
        <h3 className="mt-1 font-heading text-lg font-semibold">{certificate.title}</h3>
        {(competitionName ?? certificate.competitionName) && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {competitionName ?? certificate.competitionName}
          </p>
        )}
        {issued && <p className="mt-1 text-xs text-muted-foreground">Issued {issued}</p>}
        {certificate.signatureData?.signedBy && (
          <p className="mt-1 text-xs text-muted-foreground">
            Signed by {certificate.signatureData.signedBy}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {certificate.pdfUrl && (
            <a
              href={certificate.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download PDF
            </a>
          )}
          {certificate.verificationUrl && (
            <a
              href={certificate.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <QrCode className="h-4 w-4" aria-hidden />
              Verify
            </a>
          )}
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Share
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
