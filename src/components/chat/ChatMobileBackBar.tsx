import { ArrowLeft } from 'lucide-react'

interface ChatMobileBackBarProps {
  onBack?: () => void
  title?: string
}

export function ChatMobileBackBar({ onBack, title = 'Messages' }: ChatMobileBackBarProps) {
  if (!onBack) return null

  return (
    <div className="md:hidden shrink-0 px-4 py-3 bg-sidebar border-b border-cream/10 flex items-center gap-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={onBack}
        className="p-1.5 -ml-1 text-primary-foreground/70 hover:text-primary-foreground rounded-[12px] cursor-pointer shrink-0"
        aria-label="Back to messages"
      >
        <ArrowLeft size={20} />
      </button>
      <span className="text-sm font-semibold text-primary-foreground truncate">{title}</span>
    </div>
  )
}
