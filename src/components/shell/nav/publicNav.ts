import {
  Compass,
  Users,
  MessageSquare,
  Trophy,
  ShoppingBag,
  MessageCircle,
} from 'lucide-react'
import type { ShellNavItem } from '../types'

export const publicNavItems: ShellNavItem[] = [
  { to: '/', label: 'Explore', icon: Compass, end: true, placement: ['sidebar', 'tab'] },
  { to: '/teachers', label: 'Teachers', icon: Users, placement: ['sidebar', 'tab'] },
  { to: '/community', label: 'Community', icon: MessageSquare, placement: ['sidebar', 'tab'] },
  { to: '/competitions', label: 'Competitions', icon: Trophy, badge: 'Soon', placement: ['sidebar', 'more'] },
  { to: '/shop', label: 'Shop', icon: ShoppingBag, badge: 'Soon', placement: ['sidebar', 'more'] },
]

export const publicStudentNavItem: ShellNavItem = {
  to: '/dashboard/student/messages',
  label: 'Messages',
  icon: MessageCircle,
  badgeKey: 'messages',
  placement: ['sidebar'],
}
