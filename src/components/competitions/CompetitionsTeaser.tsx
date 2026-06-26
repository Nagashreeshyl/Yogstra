import { Calendar, MapPin } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import type { Competition } from '../../types'

interface CompetitionsTeaserProps {
  competitions: Competition[]
}

export function CompetitionsTeaser({ competitions }: CompetitionsTeaserProps) {
  return (
    <div className="mt-8">
      <h2 className="font-heading text-lg font-medium mb-4">Upcoming Competitions</h2>
      <div className="space-y-3">
        {competitions.map((comp) => (
          <Card key={comp.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-sm mb-2">{comp.name}</h3>
                <div className="flex items-center gap-3 text-xs text-charcoal/50">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {comp.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {comp.date}
                  </span>
                </div>
              </div>
              <Badge variant="v2">Coming Soon v2</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
