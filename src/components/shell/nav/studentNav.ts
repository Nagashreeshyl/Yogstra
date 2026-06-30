import {
  Home,
  Dumbbell,
  Trophy,
  MessageCircle,
  MessageSquare,
  CreditCard,
  Settings,
  Video,
} from 'lucide-react'
import type { ShellNavItem } from '../types'

export function getStudentNavItems(hasClasses: boolean): ShellNavItem[] {
  const items: ShellNavItem[] = [
    {
      to: '/dashboard/student',
      label: 'Dashboard',
      icon: Home,
      end: true,
      placement: ['sidebar', 'tab'],
    },
    {
      to: hasClasses ? '/dashboard/student/classes' : '/dashboard/student/teachers',
      label: 'Training',
      icon: hasClasses ? Video : Dumbbell,
      placement: ['sidebar', 'tab'],
    },
    {
      to: '/dashboard/student/competitions',
      label: 'Competitions',
      icon: Trophy,
      placement: ['sidebar', 'tab'],
    },
    {
      to: '/dashboard/student/messages',
      label: 'Messages',
      icon: MessageCircle,
      badgeKey: 'messages',
      placement: ['sidebar', 'tab'],
    },
    {
      to: '/dashboard/student/community',
      label: 'Community',
      icon: MessageSquare,
      placement: ['sidebar', 'more'],
    },
    {
      to: '/dashboard/student/shop',
      label: 'Payments',
      icon: CreditCard,
      badge: 'Soon',
      placement: ['sidebar', 'more'],
    },
    {
      to: '/dashboard/student/settings',
      label: 'Profile & settings',
      icon: Settings,
      placement: ['sidebar', 'more'],
    },
  ]

  return items
}
