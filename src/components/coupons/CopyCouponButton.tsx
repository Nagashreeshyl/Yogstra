import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

type CopyCouponButtonProps = {
  code: string
  variant?: 'inline' | 'button'
  onCopied?: () => void
}

export function CopyCouponButton({ code, variant = 'inline', onCopied }: CopyCouponButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      onCopied?.()
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      onCopied?.()
    }
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={() => void handleCopy()}
        className={`inline-flex items-center gap-1.5 rounded-[12px] border px-3 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
          copied
            ? 'border-primary/40 bg-primary/15 text-primary scale-[1.02]'
            : 'border-border bg-muted text-foreground hover:border-primary/30 hover:text-primary'
        }`}
      >
        <span
          className={`inline-flex transition-transform duration-300 ${
            copied ? 'scale-125 rotate-[-8deg]' : 'scale-100'
          }`}
        >
          {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
        </span>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors duration-200 ${
        copied ? 'text-primary' : 'text-muted-foreground hover:text-primary'
      }`}
    >
      <span
        className={`inline-flex transition-all duration-300 ${
          copied ? 'scale-125 text-primary' : 'scale-100'
        }`}
      >
        {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
      </span>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
