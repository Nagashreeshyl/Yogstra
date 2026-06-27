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
    <div>
      <h2 className="font-heading text-lg font-medium mb-4">Browse by Style</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {categories.map((cat) => {
          const Icon = iconMap[cat.icon] || Flower2
          const isActive = selectedCategory === cat.name
          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.name)}
              className={`shrink-0 w-28 flex flex-col items-center gap-3 p-4 border rounded-sm transition-colors cursor-pointer ${
                isActive
                  ? 'border-teal bg-teal-soft'
                  : 'border-border bg-cream hover:border-teal/50'
              }`}
            >
              <div className="w-12 h-12 flex items-center justify-center">
                <Icon size={28} className="text-teal" strokeWidth={1.5} />
              </div>
              <span className="text-xs text-center leading-tight text-charcoal font-medium">
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
