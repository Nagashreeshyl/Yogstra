import { Search } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

/** Global search placeholder — wired in a future module. */
export function SearchBar({
  placeholder = 'Search students, teachers, competitions…',
  className = '',
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        disabled
        placeholder={placeholder}
        aria-label="Global search"
        className="w-full h-9 pl-9 pr-3 text-sm rounded-[12px] border border-border bg-background/80 text-foreground placeholder:text-muted-foreground cursor-not-allowed opacity-80"
      />
      <span className="sr-only">Global search coming soon</span>
    </div>
  )
}
