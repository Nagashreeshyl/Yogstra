import type {
  Competition,
  CompetitionAnnouncement,
  CompetitionCategory,
  CompetitionCertificate,
  CompetitionDivision,
  CompetitionEvent,
  CompetitionJudge,
  CompetitionParticipant,
  CompetitionRanking,
  CompetitionRegistration,
  CompetitionResult,
  CompetitionScore,
  CertificateSignatureData,
} from '../domain/competition/models'

type Row = Record<string, unknown>

export function mapCompetition(row: Row): Competition {
  const organizer = Array.isArray(row.organizer) ? row.organizer[0] : row.organizer
  const academy = Array.isArray(row.academy) ? row.academy[0] : row.academy

  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    organizerId: (row.organizer_id as string | null) ?? null,
    academyId: (row.academy_id as string | null) ?? null,
    venue: (row.venue as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    country: (row.country as string) ?? 'IN',
    startDate: (row.start_date as string | null) ?? null,
    endDate: (row.end_date as string | null) ?? null,
    registrationDeadline: (row.registration_deadline as string | null) ?? null,
    entryFee: Number(row.entry_fee ?? 0),
    format: row.format as Competition['format'],
    scope: row.scope as Competition['scope'],
    status: row.status as Competition['status'],
    maxParticipants:
      row.max_participants === null || row.max_participants === undefined
        ? null
        : Number(row.max_participants),
    rules: (row.rules as string | null) ?? null,
    settings: (row.settings as Record<string, unknown>) ?? {},
    createdBy: (row.created_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    organizerName: (organizer as { full_name?: string } | null)?.full_name ?? null,
    academyName: (academy as { name?: string } | null)?.name ?? null,
  }
}

export function mapCompetitionEvent(row: Row): CompetitionEvent {
  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    name: row.name as string,
    venue: (row.venue as string | null) ?? null,
    stage: (row.stage as string | null) ?? null,
    startsAt: row.starts_at as string,
    endsAt: (row.ends_at as string | null) ?? null,
    sortOrder: Number(row.sort_order ?? 0),
    status: row.status as CompetitionEvent['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function mapCompetitionCategory(row: Row): CompetitionCategory {
  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    name: row.name as string,
    ageGroup: (row.age_group as CompetitionCategory['ageGroup']) ?? null,
    styleType: (row.style_type as CompetitionCategory['styleType']) ?? null,
    difficulty: (row.difficulty as CompetitionCategory['difficulty']) ?? null,
    maxParticipants:
      row.max_participants === null || row.max_participants === undefined
        ? null
        : Number(row.max_participants),
    entryFeeOverride:
      row.entry_fee_override === null || row.entry_fee_override === undefined
        ? null
        : Number(row.entry_fee_override),
    sortOrder: Number(row.sort_order ?? 0),
    status: row.status as CompetitionCategory['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function mapCompetitionDivision(row: Row): CompetitionDivision {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    name: row.name as string,
    code: (row.code as string | null) ?? null,
    maxParticipants:
      row.max_participants === null || row.max_participants === undefined
        ? null
        : Number(row.max_participants),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function mapCompetitionRegistration(row: Row): CompetitionRegistration {
  const registrant = Array.isArray(row.registrant) ? row.registrant[0] : row.registrant

  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    categoryId: (row.category_id as string | null) ?? null,
    divisionId: (row.division_id as string | null) ?? null,
    registrantId: row.registrant_id as string,
    registrantType: row.registrant_type as CompetitionRegistration['registrantType'],
    academyId: (row.academy_id as string | null) ?? null,
    batchId: (row.batch_id as string | null) ?? null,
    status: row.status as CompetitionRegistration['status'],
    paymentStatus: row.payment_status as CompetitionRegistration['paymentStatus'],
    paymentAmount:
      row.payment_amount === null || row.payment_amount === undefined
        ? null
        : Number(row.payment_amount),
    paymentReference: (row.payment_reference as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    submittedAt: row.submitted_at as string,
    confirmedAt: (row.confirmed_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    registrantName: (registrant as { full_name?: string } | null)?.full_name,
    participantCount:
      row.participant_count === undefined ? undefined : Number(row.participant_count),
  }
}

export function mapCompetitionParticipant(row: Row): CompetitionParticipant {
  const student = Array.isArray(row.student) ? row.student[0] : row.student
  const category = Array.isArray(row.category) ? row.category[0] : row.category

  return {
    id: row.id as string,
    registrationId: row.registration_id as string,
    competitionId: row.competition_id as string,
    studentId: row.student_id as string,
    categoryId: row.category_id as string,
    divisionId: (row.division_id as string | null) ?? null,
    displayName: row.display_name as string,
    dateOfBirth: (row.date_of_birth as string | null) ?? null,
    gender: (row.gender as string | null) ?? null,
    academyId: (row.academy_id as string | null) ?? null,
    teacherId: (row.teacher_id as string | null) ?? null,
    status: row.status as CompetitionParticipant['status'],
    checkInAt: (row.check_in_at as string | null) ?? null,
    documentsVerified: Boolean(row.documents_verified),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    studentName: (student as { full_name?: string } | null)?.full_name,
    categoryName: (category as { name?: string } | null)?.name,
  }
}

export function mapCompetitionJudge(row: Row): CompetitionJudge {
  const user = Array.isArray(row.user) ? row.user[0] : row.user

  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    userId: row.user_id as string,
    role: row.role as CompetitionJudge['role'],
    categoryId: (row.category_id as string | null) ?? null,
    eventId: (row.event_id as string | null) ?? null,
    status: row.status as CompetitionJudge['status'],
    invitedBy: (row.invited_by as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    userName: (user as { full_name?: string } | null)?.full_name,
  }
}

export function mapCompetitionScore(row: Row): CompetitionScore {
  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    participantId: row.participant_id as string,
    judgeId: row.judge_id as string,
    categoryId: (row.category_id as string | null) ?? null,
    eventId: (row.event_id as string | null) ?? null,
    criteria: (row.criteria as Record<string, unknown>) ?? {},
    totalScore: Number(row.total_score ?? 0),
    comments: (row.comments as string | null) ?? null,
    submittedAt: (row.submitted_at as string | null) ?? null,
    status: row.status as CompetitionScore['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function mapCompetitionResult(row: Row): CompetitionResult {
  const participant = Array.isArray(row.participant) ? row.participant[0] : row.participant

  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    participantId: row.participant_id as string,
    categoryId: row.category_id as string,
    divisionId: (row.division_id as string | null) ?? null,
    rank: row.rank === null || row.rank === undefined ? null : Number(row.rank),
    totalScore:
      row.total_score === null || row.total_score === undefined
        ? null
        : Number(row.total_score),
    medal: (row.medal as CompetitionResult['medal']) ?? null,
    status: row.status as CompetitionResult['status'],
    approvedBy: (row.approved_by as string | null) ?? null,
    approvedAt: (row.approved_at as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    participantName: (participant as { display_name?: string } | null)?.display_name,
  }
}

export function mapCompetitionCertificate(row: Row): CompetitionCertificate {
  const recipient = Array.isArray(row.recipient) ? row.recipient[0] : row.recipient
  const competition = Array.isArray(row.competition) ? row.competition[0] : row.competition

  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    participantId: (row.participant_id as string | null) ?? null,
    resultId: (row.result_id as string | null) ?? null,
    certificateType: row.certificate_type as CompetitionCertificate['certificateType'],
    recipientId: row.recipient_id as string,
    title: row.title as string,
    qrCodeToken: row.qr_code_token as string,
    verificationUrl: (row.verification_url as string | null) ?? null,
    signatureData: (row.signature_data as CertificateSignatureData) ?? {},
    pdfUrl: (row.pdf_url as string | null) ?? null,
    issuedAt: (row.issued_at as string | null) ?? null,
    expiresAt: (row.expires_at as string | null) ?? null,
    revokedAt: (row.revoked_at as string | null) ?? null,
    status: row.status as CompetitionCertificate['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    recipientName: (recipient as { full_name?: string } | null)?.full_name,
    competitionName: (competition as { name?: string } | null)?.name,
  }
}

export function mapCompetitionRanking(row: Row): CompetitionRanking {
  return {
    id: row.id as string,
    competitionId: (row.competition_id as string | null) ?? null,
    scope: row.scope as CompetitionRanking['scope'],
    subjectType: row.subject_type as CompetitionRanking['subjectType'],
    subjectId: row.subject_id as string,
    categoryId: (row.category_id as string | null) ?? null,
    periodStart: (row.period_start as string | null) ?? null,
    periodEnd: (row.period_end as string | null) ?? null,
    rank: Number(row.rank),
    points: Number(row.points ?? 0),
    season: (row.season as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    subjectName: row.subject_name as string | undefined,
  }
}

export function mapCompetitionAnnouncement(row: Row): CompetitionAnnouncement {
  return {
    id: row.id as string,
    competitionId: row.competition_id as string,
    title: row.title as string,
    body: row.body as string,
    audience: row.audience as CompetitionAnnouncement['audience'],
    publishedAt: (row.published_at as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    status: row.status as CompetitionAnnouncement['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export function slugifyCompetitionName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export function generateCertificateQrToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

export function buildCertificateVerificationUrl(token: string): string {
  return `/verify/certificate/${token}`
}
