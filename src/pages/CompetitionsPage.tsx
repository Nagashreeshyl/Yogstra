import { competitions } from '../lib/constants'
import { CompetitionsTeaser } from '../components/competitions/CompetitionsTeaser'

export function CompetitionsPage() {
  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-heading text-3xl font-medium mb-2">Competitions</h1>
      <p className="text-charcoal/60 mb-8">Discover yoga competitions across India.</p>
      <CompetitionsTeaser competitions={competitions} />
    </div>
  )
}
