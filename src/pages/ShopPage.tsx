import { Link } from 'react-router-dom'
import { ShoppingBag, Trophy, Users } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const categories = [
  {
    title: 'Find a teacher',
    description: 'Book 1-on-1 or group coaching with verified yoga teachers across India.',
    href: '/teachers',
    icon: Users,
  },
  {
    title: 'Competitions',
    description: 'Discover upcoming yoga championships and register for events near you.',
    href: '/competitions',
    icon: Trophy,
  },
  {
    title: 'Community',
    description: 'Share progress, get feedback, and connect with the Yogstra community.',
    href: '/community',
    icon: ShoppingBag,
  },
]

export function ShopPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <h1 className="font-heading text-3xl font-medium mb-2">Marketplace</h1>
      <p className="text-charcoal/60 mb-8">
        Coaching, competitions, and community — everything you need to grow your yoga practice.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map(({ title, description, href, icon: Icon }) => (
          <Card key={title} className="p-5 flex flex-col gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
              <Icon size={20} aria-hidden />
            </span>
            <div>
              <h2 className="font-medium text-foreground">{title}</h2>
              <p className="mt-1 text-sm text-charcoal/60">{description}</p>
            </div>
            <Link to={href} className="mt-auto">
              <Button variant="secondary" size="sm" className="w-full">
                Browse
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
