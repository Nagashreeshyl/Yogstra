import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useState } from 'react'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export function SearchBar({
  placeholder = 'Search students, teachers, competitions…',
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (!q) {
      navigate('/teachers')
      return
    }
    navigate(`/teachers?q=${encodeURIComponent(q)}`)
  }

  return (
    <form onSubmit={submit} className={`relative ${className}`}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Global search"
        className="w-full h-9 pl-9 pr-3 text-sm rounded-[12px] border border-border bg-background/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </form>
  )
}

export function SearchBarLink({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/teachers"
      className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground ${className}`}
    >
      <Search size={16} aria-hidden />
      Search teachers
    </Link>
  )
}
