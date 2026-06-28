import { supabase } from '../lib/supabase'
import { sanitizeText } from '../utils/sanitize'
import { isValidUpiId, sanitizeUpiId } from '../utils/upi'

export type TeacherPayoutDetails = {
  accountHolderName: string
  bankAccountNumber: string
  bankIfsc: string
  panNumber: string
  upiId: string
  linkedAccountId: string | null
  onboardingStatus: 'not_started' | 'pending' | 'active' | 'failed'
}

const emptyPayoutDetails = (): TeacherPayoutDetails => ({
  accountHolderName: '',
  bankAccountNumber: '',
  bankIfsc: '',
  panNumber: '',
  upiId: '',
  linkedAccountId: null,
  onboardingStatus: 'not_started',
})

const payoutSelectFields =
  'account_holder_name, bank_account_number, bank_ifsc, pan_number, upi_id, razorpay_linked_account_id, payout_onboarding_status'

function isMissingTableError(error: { code?: string }) {
  return error.code === 'PGRST205' || error.code === '42P01'
}

function mapPrivateRow(data: Record<string, unknown>): TeacherPayoutDetails {
  return {
    accountHolderName: (data.account_holder_name as string) ?? '',
    bankAccountNumber: (data.bank_account_number as string) ?? '',
    bankIfsc: (data.bank_ifsc as string) ?? '',
    panNumber: (data.pan_number as string) ?? '',
    upiId: (data.upi_id as string) ?? '',
    linkedAccountId: (data.razorpay_linked_account_id as string) ?? null,
    onboardingStatus:
      (data.payout_onboarding_status as TeacherPayoutDetails['onboardingStatus']) ?? 'not_started',
  }
}

export async function fetchTeacherPayoutDetails(teacherId: string): Promise<TeacherPayoutDetails | null> {
  const privateResult = await supabase
    .from('teacher_payout_private')
    .select(payoutSelectFields)
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (!privateResult.error && privateResult.data) {
    return mapPrivateRow(privateResult.data as Record<string, unknown>)
  }

  if (privateResult.error && !isMissingTableError(privateResult.error)) {
    throw privateResult.error
  }

  const legacyResult = await supabase
    .from('teacher_profiles')
    .select(payoutSelectFields)
    .eq('id', teacherId)
    .maybeSingle()

  if (legacyResult.error) {
    if (isMissingTableError(legacyResult.error)) return emptyPayoutDetails()
    throw legacyResult.error
  }

  if (!legacyResult.data) return emptyPayoutDetails()
  return mapPrivateRow(legacyResult.data as Record<string, unknown>)
}

function buildPayoutPayload(
  details: Pick<TeacherPayoutDetails, 'accountHolderName' | 'bankAccountNumber' | 'bankIfsc' | 'panNumber'>,
  extra?: Partial<{
    razorpay_linked_account_id: string
    payout_onboarding_status: TeacherPayoutDetails['onboardingStatus']
  }>,
) {
  return {
    account_holder_name: sanitizeText(details.accountHolderName, 120),
    bank_account_number: details.bankAccountNumber.trim().replace(/\D/g, '').slice(0, 18),
    bank_ifsc: sanitizeText(details.bankIfsc, 11).toUpperCase(),
    pan_number: sanitizeText(details.panNumber, 10).toUpperCase() || null,
    payout_onboarding_status: extra?.payout_onboarding_status ?? ('pending' as const),
    ...(extra?.razorpay_linked_account_id
      ? { razorpay_linked_account_id: extra.razorpay_linked_account_id }
      : {}),
  }
}

async function writePayoutDetails(
  teacherId: string,
  details: Pick<TeacherPayoutDetails, 'accountHolderName' | 'bankAccountNumber' | 'bankIfsc' | 'panNumber'>,
  extra?: Partial<{
    razorpay_linked_account_id: string
    payout_onboarding_status: TeacherPayoutDetails['onboardingStatus']
  }>,
) {
  const payload = buildPayoutPayload(details, extra)

  const privateWrite = await supabase.from('teacher_payout_private').upsert(
    {
      teacher_id: teacherId,
      ...payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'teacher_id' },
  )

  if (!privateWrite.error) return

  if (!isMissingTableError(privateWrite.error)) {
    throw privateWrite.error
  }

  const legacyWrite = await supabase
    .from('teacher_profiles')
    .update(payload)
    .eq('id', teacherId)

  if (legacyWrite.error) throw legacyWrite.error
}

async function writeTeacherUpi(teacherId: string, upiId: string) {
  const payload = {
    upi_id: upiId || null,
    updated_at: new Date().toISOString(),
  }

  const privateWrite = await supabase.from('teacher_payout_private').upsert(
    {
      teacher_id: teacherId,
      ...payload,
    },
    { onConflict: 'teacher_id' },
  )

  if (!privateWrite.error) return

  if (!isMissingTableError(privateWrite.error)) {
    throw privateWrite.error
  }

  const legacyWrite = await supabase.from('teacher_profiles').update(payload).eq('id', teacherId)
  if (legacyWrite.error) throw legacyWrite.error
}

export async function saveTeacherUpiLocally(teacherId: string, upiId: string) {
  const normalized = sanitizeUpiId(upiId)
  if (!normalized) throw new Error('Enter your UPI ID.')
  if (!isValidUpiId(normalized)) {
    throw new Error('Enter a valid UPI ID (e.g. name@upi or phone@paytm).')
  }
  await writeTeacherUpi(teacherId, normalized)
}

export async function saveTeacherPayoutDetailsLocally(
  teacherId: string,
  details: Pick<TeacherPayoutDetails, 'accountHolderName' | 'bankAccountNumber' | 'bankIfsc' | 'panNumber'>,
) {
  await writePayoutDetails(teacherId, details, { payout_onboarding_status: 'pending' })
}

export async function saveTeacherLinkedAccountLocally(
  teacherId: string,
  linkedAccountId: string,
  onboardingStatus: 'pending' | 'active' | 'failed',
) {
  const privateWrite = await supabase.from('teacher_payout_private').upsert(
    {
      teacher_id: teacherId,
      razorpay_linked_account_id: linkedAccountId,
      payout_onboarding_status: onboardingStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'teacher_id' },
  )

  if (!privateWrite.error) return

  if (!isMissingTableError(privateWrite.error)) {
    throw privateWrite.error
  }

  const legacyWrite = await supabase
    .from('teacher_profiles')
    .update({
      razorpay_linked_account_id: linkedAccountId,
      payout_onboarding_status: onboardingStatus,
    })
    .eq('id', teacherId)

  if (legacyWrite.error) throw legacyWrite.error
}

export type SetupPayoutResult = {
  ok: boolean
  linkedAccountId?: string
  status?: string
  bankSavedOnly?: boolean
  warning?: string
}

export async function setupTeacherRazorpayPayout(params: {
  teacherId: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  pan?: string
  upiId?: string
}): Promise<SetupPayoutResult> {
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) throw new Error('Please sign in again.')
  if (session.session?.user.id !== params.teacherId) {
    throw new Error('You can only update your own payout details.')
  }

  await saveTeacherPayoutDetailsLocally(params.teacherId, {
    accountHolderName: params.accountHolderName,
    bankAccountNumber: params.accountNumber,
    bankIfsc: params.ifsc,
    panNumber: params.pan ?? '',
  })

  if (params.upiId?.trim()) {
    await saveTeacherUpiLocally(params.teacherId, params.upiId)
  }

  let response: Response
  try {
    response = await fetch('/api/teacher-payout-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        accountHolderName: params.accountHolderName,
        accountNumber: params.accountNumber,
        ifsc: params.ifsc,
        pan: params.pan,
      }),
    })
  } catch {
    return {
      ok: true,
      bankSavedOnly: true,
      warning:
        'Bank details saved. Razorpay connection is temporarily unavailable — payouts will be processed manually until Route is connected.',
    }
  }

  const body = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    linkedAccountId?: string
    status?: string
  }

  if (!response.ok || !body.ok) {
    const apiError = body.error ?? 'Could not connect bank account for payouts.'
    if (
      apiError.includes('service role') ||
      apiError.includes('Route') ||
      apiError.includes('Razorpay')
    ) {
      return {
        ok: true,
        bankSavedOnly: true,
        warning:
          'Bank details saved. Automatic Razorpay payout linking failed — your earnings will be tracked and paid manually until Route is enabled.',
      }
    }
    throw new Error(apiError)
  }

  if (body.linkedAccountId) {
    const onboardingStatus =
      body.status === 'active' ? 'active' : body.status === 'failed' ? 'failed' : 'pending'
    await saveTeacherLinkedAccountLocally(params.teacherId, body.linkedAccountId, onboardingStatus)
  }

  return {
    ok: true,
    linkedAccountId: body.linkedAccountId,
    status: body.status,
  }
}
