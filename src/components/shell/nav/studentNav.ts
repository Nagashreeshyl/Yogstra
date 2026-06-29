import {
  Home,
  Compass,
  Users,
  MessageSquare,
  MessageCircle,
  Video,
  Trophy,
  ShoppingBag,
  Settings,
} from 'lucide-react'
import type { ShellNavItem } from '../types'

export function getStudentNavItems(hasClasses: boolean): ShellNavItem[] {
  const classesItem: ShellNavItem = {
    to: '/dashboard/student/classes',
    label: 'Classes',
    icon: Video,
    placement: ['sidebar', 'tab'],
  }

  const core: ShellNavItem[] = [
    {
      to: '/dashboard/student',
      label: 'Home',
      icon: Home,
      end: true,
      placement: ['sidebar', 'tab'],
    },
    { to: '/dashboard/student/teachers', label: 'Teachers', icon: Users, placement: ['sidebar', 'tab'] },
    {
      to: '/dashboard/student/explore',
      label: 'Explore',
      icon: Compass,
      placement: ['sidebar', 'more'],
    },
    {
      to: '/dashboard/student/community',
      label: 'Community',
      icon: MessageSquare,
      placement: ['sidebar', hasClasses ? 'more' : 'tab'],
    },
  ]

  if (hasClasses) core.push(classesItem)

  core.push(
    {
      to: '/dashboard/student/messages',
      label: 'Messages',
      icon: MessageCircle,
      badgeKey: 'messages',
      placement: ['sidebar', 'tab'],
    },
    {
      to: '/dashboard/student/competitions',
      label: 'Competitions',
      icon: Trophy,
      placement: ['sidebar', 'more'],
    },
    {
      to: '/dashboard/student/shop',
      label: 'Shop',
      icon: ShoppingBag,
      badge: 'Soon',
      placement: ['sidebar', 'more'],
    },
    {
      to: '/dashboard/student/settings',
      label: 'Profile',
      icon: Settings,
      placement: ['sidebar', 'more'],
    },
  )

  return core
}
