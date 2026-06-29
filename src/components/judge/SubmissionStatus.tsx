interface SubmissionStatusProps {
  status: 'idle' | 'submitting' | 'success' | 'error' | 'offline'
  message?: string
}

export function SubmissionStatus({ status, message }: SubmissionStatusProps) {
  if (status === 'idle') return null

  const styles = {
    submitting: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    offline: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  }

  const labels = {
    submitting: 'Submitting score…',
    success: 'Score submitted successfully.',
    error: message ?? 'Could not submit score.',
    offline: message ?? 'Saved offline — will sync when connected.',
  }

  return (
    <div
      className={`rounded-[12px] px-4 py-3 text-sm font-medium ${styles[status]}`}
      role="status"
      aria-live="assertive"
    >
      {labels[status]}
    </div>
  )
}
