import type { FilterState, Teacher } from '../types'

export function filterTeachers(
  allTeachers: Teacher[],
  searchQuery: string,
  filters: FilterState,
  selectedCategory: string | null,
): Teacher[] {
  let result = allTeachers.filter((t) => t.status === 'Verified')

  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.specializations.some((s) => s.toLowerCase().includes(q)),
    )
  }

  const cats = selectedCategory
    ? [selectedCategory]
    : filters.categories

  if (cats.length > 0) {
    result = result.filter((t) =>
      t.specializations.some((s) => cats.includes(s)),
    )
  }

  if (filters.teachingMode) {
    result = result.filter((t) => t.teachingMode === filters.teachingMode)
  }

  if (filters.priceMax < 10000) {
    result = result.filter((t) => t.monthlyFee <= filters.priceMax)
  }

  if (filters.location) {
    result = result.filter((t) =>
      t.city.toLowerCase().includes(filters.location.toLowerCase()),
    )
  }

  if (filters.rating > 0) {
    result = result.filter((t) => t.rating >= filters.rating)
  }

  if (filters.experience && filters.experience !== 'Any') {
    result = result.filter((t) => {
      const yrs = t.experienceYears
      switch (filters.experience) {
        case '1-3 years': return yrs >= 1 && yrs <= 3
        case '3-5 years': return yrs >= 3 && yrs <= 5
        case '5-10 years': return yrs >= 5 && yrs <= 10
        case '10+ years': return yrs >= 10
        default: return true
      }
    })
  }

  return result
}
