import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Copy, CornerUpLeft, Trash2 } from 'lucide-react'
import { ChatActionModal } from './ChatActionModal'

interface ChatMessageMenuProps {
  isSent: boolean
  canModify: boolean
  onReply: () => void
  onCopy: () => void
  onDeleteForMe: () => void
  onDeleteForEveryone: () => void
}

export function ChatMessageMenu({
  isSent,
  canModify,
  onReply,
  onCopy,
  onDeleteForMe,
  onDeleteForEveryone,
}: ChatMessageMenuProps) {
  const [open, setOpen] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  /** Dropdown below the chevron — avoids clipping off the screen edge */
  const popupAlign = isSent ? 'left-0' : 'right-0'

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const closeMenu = () => setOpen(false)

  return (
    <>
      <div
        ref={ref}
        className={`relative shrink-0 self-center opacity-70 sm:opacity-0 sm:group-hover:opacity-100 pointer-events-auto sm:pointer-events-none sm:group-hover:pointer-events-auto transition-opacity duration-150 ${
          open ? 'opacity-100 pointer-events-auto' : ''
        }`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          className="w-7 h-7 inline-flex items-center justify-center rounded-full cursor-pointer transition-colors text-charcoal/40 hover:text-charcoal/70 hover:bg-charcoal/10"
          aria-label="Message options"
        >
          <ChevronDown size={16} strokeWidth={2.5} />
        </button>

        {open && (
          <div
            className={`absolute top-full mt-1 z-30 min-w-[168px] py-1.5 rounded-xl shadow-xl border border-charcoal/10 ${popupAlign}`}
            style={{ backgroundColor: '#233138' }}
          >
            <MenuItem icon={CornerUpLeft} label="Reply" onClick={() => { closeMenu(); onReply() }} />
            <MenuItem icon={Copy} label="Copy" onClick={() => { closeMenu(); onCopy() }} />
            {canModify && (
              <MenuItem
                icon={Trash2}
                label="Delete"
                danger
                onClick={() => {
                  closeMenu()
                  setShowDeleteModal(true)
                }}
              />
            )}
          </div>
        )}
      </div>

      <ChatActionModal
        isOpen={showDeleteModal}
        title="Delete message?"
        onClose={() => setShowDeleteModal(false)}
        actions={[
          {
            label: 'Delete for everyone',
            danger: true,
            onClick: () => {
              setShowDeleteModal(false)
              onDeleteForEveryone()
            },
          },
          {
            label: 'Delete for me',
            onClick: () => {
              setShowDeleteModal(false)
              onDeleteForMe()
            },
          },
          {
            label: 'Cancel',
            onClick: () => setShowDeleteModal(false),
          },
        ]}
      />
    </>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon?: typeof Copy
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left cursor-pointer transition-colors ${
        danger ? 'text-red-300 hover:bg-white/5' : 'text-cream hover:bg-white/5'
      }`}
    >
      {Icon && <Icon size={16} className="shrink-0 opacity-80" />}
      {label}
    </button>
  )
}
