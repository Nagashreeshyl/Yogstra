import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { SelectOption } from './SearchablePersonSelect'

interface CustomSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  className?: string
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Choose…',
  disabled = false,
  required = false,
  id,
  className = '',
}: CustomSelectProps) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const selected = options.find((option) => option.id === value)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-[12px] border border-border bg-elevated px-4 text-left text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
      >
        <span className={selected ? '' : 'text-muted-foreground'}>
          {selected ? (
            <>
              {selected.label}
              {selected.hint ? ` · ${selected.hint}` : ''}
            </>
          ) : (
            placeholder
          )}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>
      {required && !value && (
        <input
          tabIndex={-1}
          value=""
          readOnly
          required
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          onChange={() => {}}
        />
      )}
      {open && (
        <ul
          role="listbox"
          aria-labelledby={fieldId}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-[12px] border border-border bg-elevated py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-4 py-2.5 text-sm text-muted-foreground">No options available</li>
          ) : (
            options.map((option) => {
              const isSelected = option.id === value
              return (
                <li key={option.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted ${
                      isSelected ? 'bg-muted/70 font-medium text-foreground' : 'text-foreground'
                    }`}
                    onClick={() => {
                      onChange(option.id)
                      setOpen(false)
                    }}
                  >
                    <span>
                      {option.label}
                      {option.hint ? (
                        <span className="text-muted-foreground"> · {option.hint}</span>
                      ) : null}
                    </span>
                    {isSelected && <Check size={16} className="shrink-0 text-primary" aria-hidden />}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}
