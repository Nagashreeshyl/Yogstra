import { useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { EmptyState } from '../shell/EmptyState'

export interface DataTableProps {
  headers: string[]
  children: ReactNode
  searchPlaceholder?: string
  filterOptions?: { label: string; value: string }[]
  onSearch?: (q: string) => void
  onFilter?: (value: string) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  isEmpty?: boolean
}

export function DataTable({
  headers,
  children,
  searchPlaceholder = 'Search...',
  filterOptions,
  onSearch,
  onFilter,
  emptyTitle,
  emptyDescription,
  emptyAction,
  isEmpty,
}: DataTableProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  return (
    <div className="space-y-4">
      {(onSearch || filterOptions) && (
        <div className="flex flex-wrap gap-3">
          {onSearch && (
            <div className="relative min-w-[200px] flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  onSearch?.(e.target.value)
                }}
                className="h-11 w-full rounded-[12px] border border-border bg-elevated pl-9 pr-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {filterOptions && (
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                onFilter?.(e.target.value)
              }}
              className="h-11 rounded-[12px] border border-border bg-elevated px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              aria-label="Filter"
            >
              <option value="">All statuses</option>
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {isEmpty && emptyTitle ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-border bg-elevated shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">{children}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export interface TablePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function TablePagination({ page, totalPages, onPageChange }: TablePaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav className="mt-4 flex items-center justify-center gap-2" aria-label="Pagination">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="h-9 rounded-[12px] border border-border px-3 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Previous
      </button>
      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="h-9 rounded-[12px] border border-border px-3 text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        Next
      </button>
    </nav>
  )
}

export function TableStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[16px] border border-border bg-elevated p-5 shadow-sm">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

/** @deprecated Use DataTable */
export const AdminTable = DataTable
/** @deprecated Use TablePagination */
export const AdminPagination = TablePagination
/** @deprecated Use TableStatCard */
export const StatCard = TableStatCard
