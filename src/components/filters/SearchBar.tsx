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
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-11 pr-4 py-3 bg-surface-elevated border border-surface-inset rounded-sm text-charcoal placeholder:text-charcoal/45 focus:outline-none focus:border-teal focus:bg-surface-muted transition-colors shadow-sm"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 border border-surface-inset rounded-sm text-sm text-charcoal bg-surface-elevated hover:bg-surface-muted transition-colors cursor-pointer shadow-sm shrink-0"
          aria-label="Filters"
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

export function useFilteredTeachers() {
  const { searchQuery, filters, selectedCategory } = useApp()
  // Import dynamically to avoid circular deps - we'll filter in pages
  return { searchQuery, filters, selectedCategory }
}

export { defaultFilters }
