import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  id?: string
}

export function PasswordInput({ label, value, onChange, required, id }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-charcoal">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 pr-11 bg-cream border border-border rounded-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:border-teal transition-colors"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal cursor-pointer"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}
