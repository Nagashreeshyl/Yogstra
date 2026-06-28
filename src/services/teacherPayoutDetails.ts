import { supabase } from '../lib/supabase'
import { sanitizeText } from '../utils/sanitize'

export type TeacherPayoutDetails = {
  accountHolderName: string
  bankAccountNumber: string
  bankIfsc: string
  panNumber: string
  linkedAccountId: string | null
  onboardingStatus: 'not_started' | 'pending' | 'active' | 'failed'
}

const payoutSelect =
  'account_holder_name, bank_account_number, bank_ifsc, pan_number, razorpay_linked_account_id, payout_onboarding_status'

export async function fetchTeacherPayoutDetails(teacherId: string): Promise<TeacherPayoutDetails | null> {
  const { data, error } = await supabase
    .from('teacher_payout_private')
    .select(payoutSelect)
    .eq('teacher_id', teacherId)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      return {
        accountHolderName: '',
        bankAccountNumber: '',
        bankIfsc: '',
        panNumber: '',
        linkedAccountId: null,
        onboardingStatus: 'not_started',
      }
    }
    throw error
  }
  if (!data) {
    return {
      accountHolderName: '',
      bankAccountNumber: '',
      bankIfsc: '',
      panNumber: '',
      linkedAccountId: null,
      onboardingStatus: 'not_started',
    }
  }

  return {
    accountHolderName: data.account_holder_name ?? '',
    bankAccountNumber: data.bank_account_number ?? '',
    bankIfsc: data.bank_ifsc ?? '',
    panNumber: data.pan_number ?? '',
    linkedAccountId: data.razorpay_linked_account_id ?? null,
    onboardingStatus: (data.payout_onboarding_status as TeacherPayoutDetails['onboardingStatus']) ?? 'not_started',
  }
}

export async function saveTeacherPayoutDetailsLocally(
  teacherId: string,
  details: Pick<TeacherPayoutDetails, 'accountHolderName' | 'bankAccountNumber' | 'bankIfsc' | 'panNumber'>,
) {
  const { error } = await supabase.from('teacher_payout_private').upsert(
    {
      teacher_id: teacherId,
      account_holder_name: sanitizeText(details.accountHolderName, 120),
      bank_account_number: details.bankAccountNumber.trim().replace(/\D/g, '').slice(0, 18),
      bank_ifsc: sanitizeText(details.bankIfsc, 11).toUpperCase(),
      pan_number: sanitizeText(details.panNumber, 10).toUpperCase() || null,
      payout_onboarding_status: 'pending',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'teacher_id' },
  )

  if (error) throw error
}

export async function saveTeacherLinkedAccountLocally(
  teacherId: string,
  linkedAccountId: string,
  onboardingStatus: 'pending' | 'active' | 'failed',
) {
  const { error } = await supabase.from('teacher_payout_private').upsert(
    {
      teacher_id: teacherId,
      razorpay_linked_account_id: linkedAccountId,
      payout_onboarding_status: onboardingStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'teacher_id' },
  )

  if (error) throw error
}

export async function setupTeacherRazorpayPayout(params: {
  teacherId: string
  accountHolderName: string
  accountNumber: string
  ifsc: string
  pan?: string
}) {
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

  const response = await fetch('/api/teacher-payout-setup', {
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

  const body = (await response.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
    linkedAccountId?: string
    status?: string
  }

  if (!response.ok || !body.ok) {
    throw new Error(body.error ?? 'Could not connect bank account for payouts.')
  }

  if (body.linkedAccountId) {
    const onboardingStatus =
      body.status === 'active' ? 'active' : body.status === 'failed' ? 'failed' : 'pending'
    await saveTeacherLinkedAccountLocally(params.teacherId, body.linkedAccountId, onboardingStatus)
  }

  return body
}
