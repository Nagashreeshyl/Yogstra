import { Badge } from '../components/ui/Badge'

export function ShopPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-heading text-3xl font-medium">Shop</h1>
        <Badge variant="v2">Coming Soon v2</Badge>
      </div>
      <p className="text-charcoal/60">
        Premium yoga mats, props, and apparel — launching soon.
      </p>
    </div>
  )
}
