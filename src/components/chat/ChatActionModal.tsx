interface ChatActionModalProps {
  isOpen: boolean
  title: string
  onClose: () => void
  actions: Array<{
    label: string
    onClick: () => void
    danger?: boolean
  }>
}

/** WhatsApp-style dark action modal for delete message / delete chat */
export function ChatActionModal({ isOpen, title, onClose, actions }: ChatActionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal/60" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: '#233138' }}
      >
        <div className="px-6 pt-6 pb-5">
          <h3 className="text-lg font-medium text-cream">{title}</h3>
        </div>
        <div className="flex items-center justify-end gap-1 px-4 pb-4 flex-wrap">
          {actions.map(({ label, onClick, danger }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-colors ${
                danger
                  ? 'text-red-400 hover:bg-white/5'
                  : 'text-teal hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
