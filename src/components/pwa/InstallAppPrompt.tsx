import { useState } from 'react'
import { Download, MoreVertical, Share, Smartphone, X } from 'lucide-react'
import { usePwaInstall } from '../../hooks/usePwaInstall'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

type InstallAppPromptProps = {
  variant?: 'header' | 'banner' | 'sidebar'
}

export function InstallAppPrompt({ variant = 'banner' }: InstallAppPromptProps) {
  const { canPrompt, isIOS, isAndroid, hasNativePrompt, installNative, dismiss } = usePwaInstall()
  const [showHelp, setShowHelp] = useState(false)

  if (!canPrompt) return null

  const handleClick = async () => {
    if (hasNativePrompt) {
      await installNative()
      return
    }
    setShowHelp(true)
  }

  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={() => void handleClick()}
          className="ml-auto p-2 text-primary-foreground/70 hover:text-primary-foreground rounded-[12px] cursor-pointer shrink-0"
          aria-label="Install Yogstra app"
          title="Install app"
        >
          <Download size={20} />
        </button>
        <InstallHelpModal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          isIOS={isIOS}
          isAndroid={isAndroid}
        />
      </>
    )
  }

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={() => void handleClick()}
          className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-primary-foreground/60 hover:text-primary-foreground hover:bg-foreground/30 rounded-sm transition-colors cursor-pointer"
        >
          <Smartphone size={16} />
          Add to Home Screen
        </button>
        <InstallHelpModal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          isIOS={isIOS}
          isAndroid={isAndroid}
        />
      </>
    )
  }

  return (
    <>
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-[55] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-md flex items-center gap-3 rounded-sm border border-border bg-elevated px-4 py-3 shadow-lg">
          <div className="w-10 h-10 rounded-[12px] bg-primary/15 flex items-center justify-center shrink-0">
            <Smartphone size={20} className="text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Install Yogstra</p>
            <p className="text-xs text-foreground/55 truncate">Add to your home screen for quick access</p>
          </div>
          <Button size="sm" className="shrink-0" onClick={() => void handleClick()}>
            Install
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="p-1 text-muted-foreground/70 hover:text-foreground cursor-pointer shrink-0"
            aria-label="Dismiss install prompt"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      <InstallHelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        isIOS={isIOS}
        isAndroid={isAndroid}
      />
    </>
  )
}

function InstallHelpModal({
  isOpen,
  onClose,
  isIOS,
  isAndroid,
}: {
  isOpen: boolean
  onClose: () => void
  isIOS: boolean
  isAndroid: boolean
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-[12px] bg-primary/15 flex items-center justify-center">
          <Smartphone size={28} className="text-primary" />
        </div>
        <h2 className="font-heading text-xl font-medium mb-2">Add Yogstra to Home Screen</h2>
        <p className="text-sm text-muted-foreground">
          Install Yogstra like an app — open it from your home screen with one tap.
        </p>
      </div>

      {isIOS ? (
        <ol className="space-y-4 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <StepNumber n={1} />
            <span className="flex items-center gap-2 pt-0.5">
              Tap <Share size={16} className="text-primary shrink-0" /> Share in Safari
            </span>
          </li>
          <li className="flex items-start gap-3">
            <StepNumber n={2} />
            <span className="pt-0.5">
              Scroll and tap <strong>Add to Home Screen</strong>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <StepNumber n={3} />
            <span className="pt-0.5">
              Tap <strong>Add</strong>
            </span>
          </li>
        </ol>
      ) : isAndroid ? (
        <ol className="space-y-4 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <StepNumber n={1} />
            <span className="flex items-center gap-2 pt-0.5">
              Tap <MoreVertical size={16} className="text-primary shrink-0" /> menu in Chrome
            </span>
          </li>
          <li className="flex items-start gap-3">
            <StepNumber n={2} />
            <span className="pt-0.5">
              Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <StepNumber n={3} />
            <span className="pt-0.5">Confirm to add Yogstra to your home screen</span>
          </li>
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Use your browser menu to <strong>Add to Home Screen</strong> or <strong>Install app</strong>.
        </p>
      )}

      <Button className="w-full mt-8" onClick={onClose}>
        Got it
      </Button>
    </Modal>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
  )
}
