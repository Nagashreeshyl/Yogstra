import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import type { BreadcrumbItem } from './types'

const SEGMENT_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  student: 'Student',
  teacher: 'Teacher',
  explore: 'Explore',
  teachers: 'Teachers',
  community: 'Community',
  competitions: 'Competitions',
  shop: 'Shop',
  messages: 'Messages',
  classes: 'Classes',
  settings: 'Settings',
  students: 'Students',
  schedule: 'Schedule',
  notifications: 'Notifications',
  coupons: 'Coupons',
  earnings: 'Earnings',
  bookings: 'Bookings',
  schedules: 'Schedules',
  chats: 'Chats',
  payouts: 'Payouts',
  categories: 'Categories',
  room: 'Live Room',
  'privacy-policy': 'Privacy Policy',
  'terms-of-service': 'Terms of Service',
  'refund-policy': 'Refund Policy',
}

function isUuid(segment: string) {
  return /^[0-9a-f-]{36}$/i.test(segment)
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const { pathname } = useLocation()

  return useMemo(() => {
    if (pathname === '/') return [{ label: 'Explore' }]

    const segments = pathname.split('/').filter(Boolean)
    const items: BreadcrumbItem[] = []
    let path = ''

    for (let i = 0; i < segments.length; i += 1) {
      const segment = segments[i]
      path += `/${segment}`

      if (isUuid(segment)) {
        items.push({ label: 'Details' })
        continue
      }

      const label = SEGMENT_LABELS[segment] ?? segment.replace(/-/g, ' ')
      const isLast = i === segments.length - 1
      items.push(isLast ? { label } : { label, to: path })
    }

    return items
  }, [pathname])
}
