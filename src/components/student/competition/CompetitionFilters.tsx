import { SlidersHorizontal } from 'lucide-react'
import type { CompetitionListFilters } from '../../../services/studentCompetitionExperience'

interface CompetitionFiltersProps {
  filters: CompetitionListFilters
  onChange: (next: CompetitionListFilters) => void
  states: string[]
  countries: string[]
  organizers: string[]
}

const AGE_GROUPS = ['under_8', 'under_10', 'under_12', 'under_14', 'under_16', 'under_18', 'open', 'masters']
const SORT_OPTIONS: { value: CompetitionListFilters['sort']; label: string }[] = [
  { value: 'nearest', label: 'Nearest' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'closing_soon', label: 'Closing soon' },
]

export function CompetitionFilters({
  filters,
  onChange,
  states,
  countries,
  organizers,
}: CompetitionFiltersProps) {
  const set = (patch: Partial<CompetitionListFilters>) => onChange({ ...filters, ...patch })

  return (
    <section
      className="mb-6 rounded-[12px] border border-border bg-muted/30 p-4"
      aria-label="Competition filters"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filters & sorting
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs">
          <span className="mb-1 block text-muted-foreground">Age group</span>
          <select
            value={filters.ageGroup ?? ''}
            onChange={(e) => set({ ageGroup: e.target.value || undefined })}
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-2 text-sm"
          >
            <option value="">All ages</option>
            {AGE_GROUPS.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block text-muted-foreground">State</span>
          <select
            value={filters.state ?? ''}
            onChange={(e) => set({ state: e.target.value || undefined })}
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-2 text-sm"
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block text-muted-foreground">Country</span>
          <select
            value={filters.country ?? ''}
            onChange={(e) => set({ country: e.target.value || undefined })}
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-2 text-sm"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block text-muted-foreground">Organizer</span>
          <select
            value={filters.organizer ?? ''}
            onChange={(e) => set({ organizer: e.target.value || undefined })}
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-2 text-sm"
          >
            <option value="">All organizers</option>
            {organizers.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block text-muted-foreground">Format</span>
          <select
            value={filters.format ?? ''}
            onChange={(e) =>
              set({ format: (e.target.value as CompetitionListFilters['format']) || undefined })
            }
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-2 text-sm"
          >
            <option value="">All formats</option>
            <option value="online">Online</option>
            <option value="offline">In person</option>
          </select>
        </label>

        <label className="block text-xs">
          <span className="mb-1 block text-muted-foreground">Max price (₹)</span>
          <input
            type="number"
            min={0}
            value={filters.priceMax ?? ''}
            onChange={(e) =>
              set({ priceMax: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="Any"
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-2 text-sm"
          />
        </label>

        <label className="flex min-h-[44px] items-end gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={filters.registrationOpen ?? false}
            onChange={(e) => set({ registrationOpen: e.target.checked || undefined })}
            className="h-4 w-4 accent-primary"
          />
          Registration open only
        </label>

        <label className="block text-xs sm:col-span-2 lg:col-span-1">
          <span className="mb-1 block text-muted-foreground">Sort by</span>
          <select
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value as CompetitionListFilters['sort'] })}
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-2 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
