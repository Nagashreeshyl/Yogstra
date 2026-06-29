import { useState } from 'react'
import { Button } from './Button'
import { Input } from './Input'

interface NameConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmName: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function NameConfirmModal({
  isOpen,
  title,
  message,
  confirmName,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: NameConfirmModalProps) {
  const [typed, setTyped] = useState('')

  if (!isOpen) return null

  const matches = typed.trim() === confirmName.trim()

  const handleCancel = () => {
    setTyped('')
    onCancel()
  }

  const handleConfirm = () => {
    if (!matches) return
    setTyped('')
    onConfirm()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px]" onClick={handleCancel} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-[16px] border border-border bg-elevated p-6 shadow-md">
        <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{message}</p>
        <Input
          label={`Type "${confirmName}" to confirm`}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
        />
        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" className="flex-1" disabled={!matches} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
