import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useApp, defaultFilters } from '../../context/AppContext'
import { FilterPanel } from './FilterPanel'

interface SearchBarProps {
  placeholder?: string
}

export function SearchBar({ placeholder = 'Search teachers, styles, locations...' }: SearchBarProps) {
  const { searchQuery, setSearchQuery } = useApp()
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="h-12 w-full rounded-[12px] border border-border bg-elevated pl-11 pr-4 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-border bg-elevated px-3 text-sm text-foreground shadow-sm transition-colors hover:bg-muted sm:px-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          aria-label="Filters"
          aria-expanded={showFilters}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>
      {showFilters && (
        <FilterPanel onClose={() => setShowFilters(false)} />
      )}
    </div>
  )
}

export { defaultFilters }
