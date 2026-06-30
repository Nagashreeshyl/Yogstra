import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { submitBetaFeedback, type FeedbackCategory } from '../../services/betaFeedback'
import { formatUserFacingError } from '../../utils/format'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

const CATEGORIES: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Bug report' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'feature', label: 'Feature request' },
  { value: 'general', label: 'General feedback' },
]

export function BetaFeedbackWidget() {
  const { user } = useApp()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user || user.role === 'admin') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await submitBetaFeedback({
        category,
        message,
        pageUrl: window.location.pathname,
        role: user.role,
      })
      setDone(true)
      setMessage('')
    } catch (err) {
      setError(formatUserFacingError(err, 'Could not submit feedback. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const close = () => {
    setOpen(false)
    setDone(false)
    setError(null)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[80] inline-flex h-12 items-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-accent-foreground shadow-lg hover:opacity-90 transition-opacity"
        aria-label="Send beta feedback"
      >
        <MessageCircle size={18} />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      <Modal isOpen={open} onClose={close} title="Beta feedback">
        {done ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Thank you — your feedback helps us improve Yogstra before launch.
            </p>
            <Button type="button" onClick={close} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                    category === c.value
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="Describe what happened or what you'd like to see…"
              className="w-full rounded-[12px] border border-border bg-elevated px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Sending…' : 'Submit feedback'}
              </Button>
              <button
                type="button"
                onClick={close}
                className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-border text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
