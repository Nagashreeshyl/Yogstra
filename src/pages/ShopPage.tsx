import { Link } from 'react-router-dom'
import { ShoppingBag, Trophy, Users } from 'lucide-react'
import { PageContainer } from '../components/shell/PageContainer'
import { PageHeader } from '../components/shell/PageHeader'
import { DashboardCard } from '../components/student/dashboard/DashboardCard'
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
    <PageContainer width="narrow">
      <div className="space-y-8">
        <PageHeader
          title="Marketplace"
          description="Coaching, competitions, and community — everything you need to grow your yoga practice."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map(({ title, description, href, icon: Icon }) => (
            <DashboardCard key={title} title={title} description={description}>
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                <Icon size={20} aria-hidden />
              </span>
              <Link to={href} className="block">
                <Button variant="secondary" size="sm" className="w-full">
                  Browse
                </Button>
              </Link>
            </DashboardCard>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
