import type { IssueCertificateInput } from '../domain/competition/models'
import { competitionCertificateRepository } from '../repositories/competitionCertificateRepository'
import {
  buildCertificateVerificationUrl,
  generateCertificateQrToken,
} from '../utils/competitionMappers'

export async function fetchCertificateById(id: string) {
  return competitionCertificateRepository.findById(id)
}

export async function verifyCertificateByQrToken(token: string) {
  const certificate = await competitionCertificateRepository.findByQrToken(token)
  if (!certificate) return { valid: false as const, certificate: null }
  if (certificate.revokedAt) return { valid: false as const, certificate }
  if (certificate.expiresAt && new Date(certificate.expiresAt) < new Date()) {
    return { valid: false as const, certificate }
  }
  return { valid: true as const, certificate }
}

export async function fetchUserCertificates(recipientId: string) {
  return competitionCertificateRepository.listByRecipient(recipientId)
}

export async function fetchCompetitionCertificates(competitionId: string) {
  return competitionCertificateRepository.listByCompetition(competitionId)
}

/** Creates a draft certificate with QR token — ready for signature and PDF generation. */
export async function createCertificateDraft(input: IssueCertificateInput) {
  const qrCodeToken = generateCertificateQrToken()
  const verificationUrl = input.verificationUrl ?? buildCertificateVerificationUrl(qrCodeToken)

  return competitionCertificateRepository.createDraft({
    ...input,
    qrCodeToken,
    verificationUrl,
  })
}

/** Issues a certificate with optional digital signature metadata. */
export async function issueCertificate(
  certificateId: string,
  signatureData?: Record<string, unknown>,
) {
  return competitionCertificateRepository.issue(certificateId, signatureData)
}
