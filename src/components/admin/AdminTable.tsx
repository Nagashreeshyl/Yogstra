import { useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'

interface AdminTableProps {
  headers: string[]
  children: ReactNode
  searchPlaceholder?: string
  filterOptions?: { label: string; value: string }[]
  onSearch?: (q: string) => void
  onFilter?: (value: string) => void
}

export function AdminTable({
  headers,
  children,
  searchPlaceholder = 'Search...',
  filterOptions,
  onSearch,
  onFilter,
}: AdminTableProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              onSearch?.(e.target.value)
            }}
            className="w-full pl-9 pr-4 py-2 bg-cream border border-border rounded-sm text-sm focus:outline-none focus:border-teal"
          />
        </div>
        {filterOptions && (
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              onFilter?.(e.target.value)
            }}
            className="px-4 py-2 bg-cream border border-border rounded-sm text-sm focus:outline-none focus:border-teal"
          >
            <option value="">All statuses</option>
            {filterOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>

      <div className="border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-cream-dark border-b border-border">
              {headers.map((h) => (
                <th key={h} className="text-left px-4 py-3 font-medium text-charcoal/70">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdminPagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="px-3 py-1.5 text-sm border border-border rounded-sm disabled:opacity-40 cursor-pointer hover:bg-cream-dark"
      >
        Previous
      </button>
      <span className="text-sm text-charcoal/50">Page {page} of {totalPages}</span>
      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="px-3 py-1.5 text-sm border border-border rounded-sm disabled:opacity-40 cursor-pointer hover:bg-cream-dark"
      >
        Next
      </button>
    </div>
  )
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border rounded-sm p-5 bg-cream">
      <p className="text-xs text-charcoal/50 mb-1">{label}</p>
      <p className="font-heading text-2xl font-medium">{value}</p>
    </div>
  )
}
