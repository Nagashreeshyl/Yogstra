/**
 * Competition domain models — Yogstra V2 core entity layer.
 * Maps to tables introduced in supabase/competition-foundation.sql
 */

export type CompetitionStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'scoring'
  | 'results_pending'
  | 'completed'
  | 'archived'

export type CompetitionFormat = 'individual' | 'team' | 'online'

export type CompetitionScope = 'friendly' | 'state' | 'national' | 'international'

export type CompetitionEventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export type CompetitionAgeGroup =
  | 'under_8'
  | 'under_10'
  | 'under_12'
  | 'under_14'
  | 'under_16'
  | 'under_18'
  | 'open'
  | 'masters'

export type CompetitionStyleType =
  | 'traditional'
  | 'artistic'
  | 'rhythmic'
  | 'pair'
  | 'group'

export type CompetitionCategoryStatus = 'active' | 'archived'

export type CompetitionRegistrantType = 'student' | 'teacher' | 'academy' | 'organizer'

export type CompetitionRegistrationStatus =
  | 'pending'
  | 'confirmed'
  | 'waitlisted'
  | 'cancelled'
  | 'rejected'

export type CompetitionPaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'partial' | 'waived'

export type CompetitionParticipantStatus =
  | 'registered'
  | 'checked_in'
  | 'performing'
  | 'completed'
  | 'withdrawn'
  | 'disqualified'

export type CompetitionJudgeRole = 'head_judge' | 'judge' | 'scorer' | 'technical'

export type CompetitionJudgeStatus = 'invited' | 'active' | 'inactive' | 'removed'

export type CompetitionScoreStatus = 'draft' | 'submitted' | 'locked'

export type CompetitionResultStatus = 'provisional' | 'approved' | 'published'

export type CompetitionMedal = 'gold' | 'silver' | 'bronze' | 'participation'

export type CompetitionCertificateType = 'participation' | 'merit' | 'winner' | 'judge'

export type CompetitionCertificateStatus = 'draft' | 'issued' | 'revoked'

export type CompetitionRankingScope =
  | 'student'
  | 'teacher'
  | 'academy'
  | 'state'
  | 'national'
  | 'international'

export type CompetitionRankingSubjectType = 'student' | 'teacher' | 'academy'

export type CompetitionAnnouncementAudience =
  | 'all'
  | 'participants'
  | 'judges'
  | 'organizers'
  | 'public'

export type CompetitionAnnouncementStatus = 'draft' | 'published' | 'archived'

export interface Competition {
  id: string
  slug: string
  name: string
  description: string | null
  organizerId: string | null
  academyId: string | null
  venue: string | null
  city: string | null
  state: string | null
  country: string
  startDate: string | null
  endDate: string | null
  registrationDeadline: string | null
  entryFee: number
  format: CompetitionFormat
  scope: CompetitionScope
  status: CompetitionStatus
  maxParticipants: number | null
  rules: string | null
  settings: Record<string, unknown>
  createdBy: string | null
  createdAt: string
  updatedAt: string
  organizerName?: string | null
  academyName?: string | null
}

export interface CompetitionEvent {
  id: string
  competitionId: string
  name: string
  venue: string | null
  stage: string | null
  startsAt: string
  endsAt: string | null
  sortOrder: number
  status: CompetitionEventStatus
  createdAt: string
  updatedAt: string
}

export interface CompetitionCategory {
  id: string
  competitionId: string
  name: string
  ageGroup: CompetitionAgeGroup | null
  styleType: CompetitionStyleType | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  maxParticipants: number | null
  entryFeeOverride: number | null
  sortOrder: number
  status: CompetitionCategoryStatus
  createdAt: string
  updatedAt: string
}

export interface CompetitionDivision {
  id: string
  categoryId: string
  name: string
  code: string | null
  maxParticipants: number | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface CompetitionRegistration {
  id: string
  competitionId: string
  categoryId: string | null
  divisionId: string | null
  registrantId: string
  registrantType: CompetitionRegistrantType
  academyId: string | null
  batchId: string | null
  status: CompetitionRegistrationStatus
  paymentStatus: CompetitionPaymentStatus
  paymentAmount: number | null
  paymentReference: string | null
  notes: string | null
  submittedAt: string
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
  registrantName?: string
  participantCount?: number
}

export interface CompetitionParticipant {
  id: string
  registrationId: string
  competitionId: string
  studentId: string
  categoryId: string
  divisionId: string | null
  displayName: string
  dateOfBirth: string | null
  gender: string | null
  academyId: string | null
  teacherId: string | null
  status: CompetitionParticipantStatus
  checkInAt: string | null
  documentsVerified: boolean
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  studentName?: string
  categoryName?: string
}

export interface CompetitionJudge {
  id: string
  competitionId: string
  userId: string
  role: CompetitionJudgeRole
  categoryId: string | null
  eventId: string | null
  status: CompetitionJudgeStatus
  invitedBy: string | null
  createdAt: string
  updatedAt: string
  userName?: string
}

export interface CompetitionScore {
  id: string
  competitionId: string
  participantId: string
  judgeId: string
  categoryId: string | null
  eventId: string | null
  criteria: Record<string, unknown>
  totalScore: number
  comments: string | null
  submittedAt: string | null
  status: CompetitionScoreStatus
  createdAt: string
  updatedAt: string
}

export interface CompetitionResult {
  id: string
  competitionId: string
  participantId: string
  categoryId: string
  divisionId: string | null
  rank: number | null
  totalScore: number | null
  medal: CompetitionMedal | null
  status: CompetitionResultStatus
  approvedBy: string | null
  approvedAt: string | null
  createdAt: string
  updatedAt: string
  participantName?: string
}

export interface CompetitionCertificate {
  id: string
  competitionId: string
  participantId: string | null
  resultId: string | null
  certificateType: CompetitionCertificateType
  recipientId: string
  title: string
  qrCodeToken: string
  verificationUrl: string | null
  signatureData: CertificateSignatureData
  pdfUrl: string | null
  issuedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  status: CompetitionCertificateStatus
  createdAt: string
  updatedAt: string
  recipientName?: string
  competitionName?: string
}

/** Digital signature metadata — ready for PDF generation and verification. */
export interface CertificateSignatureData {
  algorithm?: string
  signedBy?: string
  signedAt?: string
  publicKeyId?: string
  checksum?: string
}

export interface CompetitionRanking {
  id: string
  competitionId: string | null
  scope: CompetitionRankingScope
  subjectType: CompetitionRankingSubjectType
  subjectId: string
  categoryId: string | null
  periodStart: string | null
  periodEnd: string | null
  rank: number
  points: number
  season: string | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
  subjectName?: string
}

export interface CompetitionAnnouncement {
  id: string
  competitionId: string
  title: string
  body: string
  audience: CompetitionAnnouncementAudience
  publishedAt: string | null
  createdBy: string | null
  status: CompetitionAnnouncementStatus
  createdAt: string
  updatedAt: string
}

export interface CreateCompetitionInput {
  name: string
  slug?: string
  description?: string
  organizerId?: string
  academyId?: string | null
  venue?: string
  city?: string
  state?: string
  country?: string
  startDate?: string
  endDate?: string
  registrationDeadline?: string
  entryFee?: number
  format?: CompetitionFormat
  scope?: CompetitionScope
  maxParticipants?: number
  rules?: string
}

export interface CreateCompetitionCategoryInput {
  competitionId: string
  name: string
  ageGroup?: CompetitionAgeGroup
  styleType?: CompetitionStyleType
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  maxParticipants?: number
  entryFeeOverride?: number
  sortOrder?: number
}

export interface CreateCompetitionRegistrationInput {
  competitionId: string
  categoryId?: string
  divisionId?: string
  registrantId: string
  registrantType: CompetitionRegistrantType
  academyId?: string | null
  batchId?: string | null
  notes?: string
}

export interface CreateCompetitionParticipantInput {
  registrationId: string
  competitionId: string
  studentId: string
  categoryId: string
  divisionId?: string | null
  displayName: string
  dateOfBirth?: string
  gender?: string
  academyId?: string | null
  teacherId?: string | null
  metadata?: Record<string, unknown>
}

export interface AssignCompetitionJudgeInput {
  competitionId: string
  userId: string
  role?: CompetitionJudgeRole
  categoryId?: string | null
  eventId?: string | null
  invitedBy?: string
}

export interface SubmitCompetitionScoreInput {
  competitionId: string
  participantId: string
  judgeId: string
  categoryId?: string | null
  eventId?: string | null
  criteria: Record<string, unknown>
  totalScore: number
  comments?: string
}

export interface IssueCertificateInput {
  competitionId: string
  recipientId: string
  title: string
  certificateType?: CompetitionCertificateType
  participantId?: string | null
  resultId?: string | null
  verificationUrl?: string
  signatureData?: CertificateSignatureData
}

export interface CreateRankingEntryInput {
  competitionId?: string | null
  scope: CompetitionRankingScope
  subjectType: CompetitionRankingSubjectType
  subjectId: string
  categoryId?: string | null
  rank: number
  points: number
  season?: string
  periodStart?: string
  periodEnd?: string
  metadata?: Record<string, unknown>
}
