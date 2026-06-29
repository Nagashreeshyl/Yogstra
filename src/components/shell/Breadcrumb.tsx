import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { BreadcrumbItem } from './types'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex items-center gap-1 text-sm min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <ChevronRight size={14} className="shrink-0 text-muted-foreground" aria-hidden />
              )}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`truncate ${isLast ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
