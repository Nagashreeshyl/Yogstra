import { useEffect, useRef, useState } from 'react'
import {
  Ban,
  Bell,
  BellOff,
  Flag,
  MoreVertical,
  Search,
  Trash2,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'

interface ReportChatModalProps {
  isOpen: boolean
  participantName: string
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}

export function ReportChatModal({
  isOpen,
  participantName,
  onClose,
  onSubmit,
}: ReportChatModalProps) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setReason('')
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(reason)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit report.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative bg-elevated rounded-[16px] border border-border w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Flag size={18} className="text-red-600" />
          <h3 className="font-heading text-lg font-medium">Report conversation</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Tell us why you are reporting your chat with {participantName}. A full snapshot is saved
          for admin review — even deleted messages.
        </p>
        <Textarea
          placeholder="Describe the issue..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[120px]"
        />
        {error && (
          <p className="text-sm text-red-600 mt-3 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}
        <div className="flex gap-3 mt-5">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => void handleSubmit()}
            disabled={!reason.trim() || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ChatHeaderMenuProps {
  muted: boolean
  blocked: boolean
  onReport: () => void
  onSearch: () => void
  onToggleMute: () => void
  onToggleBlock: () => void
  onDeleteChat: () => void
}

export function ChatHeaderMenu({
  muted,
  blocked,
  onReport,
  onSearch,
  onToggleMute,
  onToggleBlock,
  onDeleteChat,
}: ChatHeaderMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const menuItems: Array<{
    key: string
    label: string
    icon: typeof Search
    danger?: boolean
  }> = [
    { key: 'search', label: 'Search in chat', icon: Search },
    {
      key: 'mute',
      label: muted ? 'Unmute' : 'Mute',
      icon: muted ? Bell : BellOff,
    },
    {
      key: 'block',
      label: blocked ? 'Unblock' : 'Block',
      icon: Ban,
    },
    { key: 'delete', label: 'Delete chat', icon: Trash2 },
    { key: 'report', label: 'Report', icon: Flag, danger: true },
  ]

  const handlers: Record<string, () => void> = {
    search: onSearch,
    mute: onToggleMute,
    block: onToggleBlock,
    delete: onDeleteChat,
    report: onReport,
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 inline-flex items-center justify-center rounded-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-elevated/10 cursor-pointer transition-colors"
        aria-label="Chat options"
      >
        <MoreVertical size={20} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 min-w-[188px] py-1.5 rounded-xl shadow-xl border border-charcoal/10"
          style={{ backgroundColor: '#233138' }}
        >
          {menuItems.map(({ key, label, icon: Icon, danger }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setOpen(false)
                handlers[key]()
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer text-left transition-colors ${
                danger ? 'text-red-300 hover:bg-white/5' : 'text-primary-foreground hover:bg-white/5'
              }`}
            >
              <Icon size={16} className="opacity-80" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
