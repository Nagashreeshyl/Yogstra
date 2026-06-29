import {
  Flower2, Activity, Flame, Trophy, Wind, Sparkles, Heart, Baby,
  type LucideIcon,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

const iconMap: Record<string, LucideIcon> = {
  Flower2, Activity, Flame, Trophy, Wind, Sparkles, Heart, Baby,
}

interface CategoryFlashCardsProps {
  onSelect?: (categoryName: string) => void
}

export function CategoryFlashCards({ onSelect }: CategoryFlashCardsProps) {
  const { categories, selectedCategory, setSelectedCategory, setFilters, filters } = useApp()

  const handleClick = (name: string) => {
    const isSelected = selectedCategory === name
    if (isSelected) {
      setSelectedCategory(null)
      setFilters({ ...filters, categories: [] })
    } else {
      setSelectedCategory(name)
      setFilters({ ...filters, categories: [name] })
    }
    onSelect?.(name)
  }

  return (
    <div className="rounded-sm border border-surface-inset bg-elevated/80 p-4 shadow-sm">
      <h2 className="font-heading text-lg font-medium mb-4 text-foreground">Browse by Style</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Flower2
          const isActive = selectedCategory === cat.name
          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.name)}
              className={`shrink-0 w-28 flex flex-col items-center gap-3 p-4 rounded-[16px] border border-border transition-colors cursor-pointer ${
                isActive
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-surface-inset bg-muted hover:border-primary/40 hover:bg-elevated'
              }`}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <Icon size={28} className="text-primary" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-center leading-tight text-foreground font-medium">
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
