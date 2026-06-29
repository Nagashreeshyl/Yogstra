import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { PublicSection } from '../../components/public/PublicSection'
import { Button } from '../../components/ui/Button'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'

const plans = [
  {
    name: 'Student',
    price: 'Free',
    period: 'forever',
    description: 'Discover teachers, join academies, and register for competitions.',
    features: ['Explore teachers & academies', 'Community access', 'Competition registration', 'Direct messaging'],
    cta: 'Get Started',
    to: '/auth/student',
    highlighted: false,
  },
  {
    name: 'Teacher',
    price: '₹499',
    period: '/month',
    description: 'Manage students, schedule classes, and earn through the marketplace.',
    features: ['Verified teacher profile', 'Live classes & video calls', 'Student management', 'Earnings & payouts'],
    cta: 'Apply as Teacher',
    to: '/auth/teacher/register',
    highlighted: true,
  },
  {
    name: 'Academy',
    price: 'Custom',
    period: '',
    description: 'Full academy operations — batches, finance, staff, and competitions.',
    features: ['Multi-teacher management', 'Batch & attendance', 'Finance dashboard', 'Competition prep'],
    cta: 'Contact Sales',
    to: '/contact',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Multi-branch academies and large-scale competition organizations.',
    features: ['Dedicated support', 'Custom integrations', 'SLA & onboarding', 'White-label options'],
    cta: 'Talk to Us',
    to: '/contact',
    highlighted: false,
  },
]

export function PricingPage() {
  return (
    <PageContainer width="wide" className="py-10 sm:py-14">
      <PageHeader
        title="Pricing"
        description="Simple plans for students, teachers, academies, and enterprise organizations."
        className="mb-12"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-[20px] border p-6 flex flex-col ${
              plan.highlighted ? 'border-accent bg-elevated shadow-lg shadow-black/10' : 'border-border bg-elevated'
            }`}
          >
            <p className="text-sm text-muted-foreground">{plan.name}</p>
            <p className="font-heading text-3xl font-semibold text-foreground mt-2">
              {plan.price}
              {plan.period && <span className="text-base font-normal text-muted-foreground">{plan.period}</span>}
            </p>
            <p className="text-sm text-muted-foreground mt-3 mb-6">{plan.description}</p>
            <ul className="space-y-2 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check size={16} className="text-accent shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to={plan.to}>
              <Button variant={plan.highlighted ? 'primary' : 'secondary'} className="w-full">
                {plan.cta}
              </Button>
            </Link>
          </div>
        ))}
      </div>

      <PublicSection title="Compare plans" className="!px-0 mt-8">
        <div className="overflow-x-auto rounded-[16px] border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-foreground">Feature</th>
                <th className="p-4 font-medium text-foreground">Student</th>
                <th className="p-4 font-medium text-foreground">Teacher</th>
                <th className="p-4 font-medium text-foreground">Academy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['Live video classes', 'Join', 'Host', 'Manage'],
                ['Competitions', 'Register', 'Coach', 'Organize'],
                ['Academy tools', '—', 'Affiliate', 'Full'],
                ['Payments', 'Book', 'Receive', 'Finance'],
              ].map(([feature, ...cols]) => (
                <tr key={feature}>
                  <td className="p-4 text-muted-foreground">{feature}</td>
                  {cols.map((c) => (
                    <td key={c} className="p-4 text-center text-foreground">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PublicSection>
    </PageContainer>
  )
}
