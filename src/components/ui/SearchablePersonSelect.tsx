import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { CustomSelect } from './CustomSelect'

export interface SelectOption {
  id: string
  label: string
  hint?: string
}

interface SearchableSelectProps {
  label: string
  value: string
  onChange: (id: string) => void
  options: SelectOption[]
  loading?: boolean
  disabled?: boolean
  required?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
  selectPlaceholder?: string
  id?: string
  enableSearch?: boolean
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  required = false,
  emptyMessage = 'No matches found.',
  searchPlaceholder = 'Search…',
  selectPlaceholder = 'Choose…',
  id,
  enableSearch = true,
}: SearchableSelectProps) {
  const [search, setSearch] = useState('')
  const fieldId = id ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query || !enableSearch) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        (option.hint ?? '').toLowerCase().includes(query),
    )
  }, [options, search, enableSearch])

  const selectOptions = useMemo(() => {
    if (required) return filtered
    return [{ id: '', label: selectPlaceholder }, ...filtered]
  }, [filtered, required, selectPlaceholder])

  return (
    <div className="flex flex-col gap-2">
      {enableSearch && (
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            disabled={disabled || loading}
            className="min-h-[44px] w-full rounded-[12px] border border-border bg-elevated py-2 pl-10 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
          />
        </div>
      )}
      <CustomSelect
        label={label}
        id={fieldId}
        value={loading ? '' : value}
        onChange={onChange}
        options={loading ? [] : selectOptions}
        placeholder={loading ? 'Loading…' : selectPlaceholder}
        disabled={disabled || loading}
        required={required}
      />
      {!loading && enableSearch && search.trim() && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  )
}

export type PersonOption = SelectOption

export function SearchablePersonSelect(props: SearchableSelectProps) {
  return <SearchableSelect {...props} />
}
