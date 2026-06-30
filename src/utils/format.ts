/** Strip non-digits from Indian-formatted currency string */
export function parseIndianNumber(value: string): number {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

/** Format digits as Indian locale number (e.g. 1,00,000) */
export function formatIndianNumber(value: string | number): string {
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('en-IN')
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function capitalizeStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

export function capitalizePaymentStatus(status: string): 'Paid' | 'Pending' | 'Overdue' {
  const s = status.toLowerCase()
  if (s === 'paid') return 'Paid'
  if (s === 'overdue') return 'Overdue'
  return 'Pending'
}

export function capitalizeBookingStatus(status: string): 'Active' | 'Pending' | 'Cancelled' {
  const s = status.toLowerCase()
  if (s === 'cancelled') return 'Cancelled'
  if (s === 'pending') return 'Pending'
  return 'Active'
}

export function formatAuthError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (msg.includes('Invalid login credentials')) {
      return 'Invalid email or password. If you just signed up, confirm your email first.'
    }
    if (msg.includes('User already registered')) {
      return 'This email is already registered. Try logging in instead.'
    }
    if (msg.includes('Email not confirmed')) {
      return 'Please confirm your email before signing in.'
    }
    return formatUserFacingError(err, 'Authentication failed. Please try again.')
  }
  return 'Something went wrong. Please try again.'
}

/** Maps API/Supabase errors to plain language — never expose status codes, SQL, or stack details. */
export function formatUserFacingError(
  err: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : typeof err === 'string'
          ? err
          : ''

  if (!raw.trim()) return fallback

  if (/duplicate key|already exists|409/i.test(raw)) {
    return 'An academy with this name already exists. Refresh the page to continue setup.'
  }

  if (
    /PGRST\d+|JWT|row.level security|permission denied|violates|Run supabase\//i.test(raw) ||
    /^\d{3}\s|Unprocessable Entity|Internal Server Error|NetworkError|Failed to fetch/i.test(raw)
  ) {
    return fallback
  }

  if (raw.length > 160) return fallback

  return raw
}
