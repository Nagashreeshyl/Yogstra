import { useState } from 'react'
import { useApp, defaultFilters } from '../../context/AppContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { StarRating } from '../ui/StarRating'
import { experienceOptions } from '../../lib/constants'
import type { TeachingMode } from '../../types'

interface FilterPanelProps {
  onClose: () => void
}

export function FilterPanel({ onClose }: FilterPanelProps) {
  const { categories, filters, setFilters, setSelectedCategory } = useApp()
  const [local, setLocal] = useState({ ...filters })

  const toggleCategory = (name: string) => {
    setLocal((prev) => ({
      ...prev,
      categories: prev.categories.includes(name)
        ? prev.categories.filter((c) => c !== name)
        : [...prev.categories, name],
    }))
  }

  const apply = () => {
    setFilters(local)
    if (local.categories.length === 1) {
      setSelectedCategory(local.categories[0])
    } else if (local.categories.length === 0) {
      setSelectedCategory(null)
    }
    onClose()
  }

  const reset = () => {
    setLocal(defaultFilters)
    setFilters(defaultFilters)
    setSelectedCategory(null)
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-surface-elevated border border-surface-inset rounded-sm p-6 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium mb-3">Category</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.name)}
                className={`px-3 py-1.5 text-xs border rounded-sm transition-colors cursor-pointer ${
                  local.categories.includes(cat.name)
                    ? 'bg-teal-soft border-teal text-charcoal'
                    : 'border-surface-inset bg-surface-muted text-charcoal/70 hover:border-teal/50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Teaching Mode</p>
          <div className="flex gap-2">
            {(['Online', 'Offline', 'Both'] as TeachingMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setLocal((p) => ({ ...p, teachingMode: p.teachingMode === mode ? '' : mode }))}
                className={`px-3 py-1.5 text-xs border rounded-sm transition-colors cursor-pointer ${
                  local.teachingMode === mode
                    ? 'bg-teal-soft border-teal text-charcoal'
                    : 'border-surface-inset bg-surface-muted text-charcoal/70 hover:border-teal/50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Price Range (₹)</p>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={10000}
              step={500}
              value={local.priceMax}
              onChange={(e) => setLocal((p) => ({ ...p, priceMax: Number(e.target.value) }))}
              className="flex-1 accent-teal"
            />
            <span className="text-sm text-charcoal/70 whitespace-nowrap">Up to ₹{local.priceMax.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div>
          <Select
            label="Experience"
            value={local.experience}
            onChange={(e) => setLocal((p) => ({ ...p, experience: e.target.value }))}
          >
            {experienceOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>
        </div>

        <div>
          <Input
            label="Location"
            placeholder="Enter city..."
            value={local.location}
            onChange={(e) => setLocal((p) => ({ ...p, location: e.target.value }))}
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Rating</p>
          <StarRating
            rating={local.rating}
            interactive
            showValue={false}
            size={20}
            onChange={(r) => setLocal((p) => ({ ...p, rating: r }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
        <button onClick={reset} className="text-sm text-charcoal/50 hover:text-charcoal cursor-pointer">
          Reset all
        </button>
        <Button onClick={apply}>Apply Filters</Button>
      </div>
    </div>
  )
}
