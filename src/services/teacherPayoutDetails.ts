import { supabase } from '../lib/supabase'

export type TeacherPayoutDetails = {
  accountHolderName: string
  bankAccountNumber: string
  bankIfsc: string
  panNumber: string
  linkedAccountId: string | null
  onboardingStatus: 'not_started' | 'pending' | 'active' | 'failed'
}

export async function fetchTeacherPayoutDetails(teacherId: string): Promise<TeacherPayoutDetails | null> {
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select(
      'account_holder_name, bank_account_number, bank_ifsc, pan_number, razorpay_linked_account_id, payout_onboarding_status',
    )
    .eq('id', teacherId)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return null
    throw error
  }
  if (!data) return null

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
  const { error } = await supabase
    .from('teacher_profiles')
    .update({
      account_holder_name: details.accountHolderName.trim(),
      bank_account_number: details.bankAccountNumber.trim(),
      bank_ifsc: details.bankIfsc.trim().toUpperCase(),
      pan_number: details.panNumber.trim().toUpperCase() || null,
    })
    .eq('id', teacherId)

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

  const response = await fetch('/api/teacher-payout-setup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      teacherId: params.teacherId,
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

  return body
}
