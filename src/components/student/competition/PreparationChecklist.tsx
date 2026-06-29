import { Check } from 'lucide-react'

interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

interface PreparationChecklistProps {
  items: ChecklistItem[]
  title?: string
}

export function PreparationChecklist({
  items,
  title = 'Coach checklist',
}: PreparationChecklistProps) {
  const completed = items.filter((i) => i.done).length

  return (
    <div className="rounded-[12px] border border-border bg-muted/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted-foreground">
          {completed}/{items.length} complete
        </span>
      </div>

      <ul className="space-y-2" role="list">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                item.done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-elevated text-transparent'
              }`}
              aria-hidden
            >
              {item.done && <Check size={12} strokeWidth={3} />}
            </span>
            <span
              className={`text-sm ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
