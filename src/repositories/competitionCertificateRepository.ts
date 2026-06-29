import { supabase } from '../lib/supabase'
import type { IssueCertificateInput } from '../domain/competition/models'
import { mapCompetitionCertificate } from '../utils/competitionMappers'

const certificateSelect = `
  id,
  competition_id,
  participant_id,
  result_id,
  certificate_type,
  recipient_id,
  title,
  qr_code_token,
  verification_url,
  signature_data,
  pdf_url,
  issued_at,
  expires_at,
  revoked_at,
  status,
  created_at,
  updated_at,
  recipient:profiles!recipient_id(full_name),
  competition:competitions!competition_id(name)
`

export const competitionCertificateRepository = {
  async findById(id: string) {
    const { data, error } = await supabase
      .from('competition_certificates')
      .select(certificateSelect)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapCompetitionCertificate(data) : null
  },

  async findByQrToken(token: string) {
    const { data, error } = await supabase
      .from('competition_certificates')
      .select(certificateSelect)
      .eq('qr_code_token', token)
      .eq('status', 'issued')
      .maybeSingle()

    if (error) throw error
    return data ? mapCompetitionCertificate(data) : null
  },

  async listByRecipient(recipientId: string) {
    const { data, error } = await supabase
      .from('competition_certificates')
      .select(certificateSelect)
      .eq('recipient_id', recipientId)
      .eq('status', 'issued')
      .order('issued_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionCertificate)
  },

  async listByCompetition(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_certificates')
      .select(certificateSelect)
      .eq('competition_id', competitionId)
      .order('issued_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionCertificate)
  },

  async createDraft(input: IssueCertificateInput & { qrCodeToken: string; verificationUrl: string }) {
    const { data, error } = await supabase
      .from('competition_certificates')
      .insert({
        competition_id: input.competitionId,
        participant_id: input.participantId ?? null,
        result_id: input.resultId ?? null,
        certificate_type: input.certificateType ?? 'participation',
        recipient_id: input.recipientId,
        title: input.title,
        qr_code_token: input.qrCodeToken,
        verification_url: input.verificationUrl,
        signature_data: input.signatureData ?? {},
        status: 'draft',
      })
      .select(certificateSelect)
      .single()

    if (error) throw error
    return mapCompetitionCertificate(data)
  },

  async issue(id: string, signatureData?: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('competition_certificates')
      .update({
        status: 'issued',
        issued_at: new Date().toISOString(),
        signature_data: signatureData ?? {},
      })
      .eq('id', id)
      .select(certificateSelect)
      .single()

    if (error) throw error
    return mapCompetitionCertificate(data)
  },
}
