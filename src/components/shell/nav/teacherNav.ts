import {
  LayoutDashboard,
  Users,
  Video,
  Calendar,
  MessageSquare,
  MessageCircle,
  Bell,
  Ticket,
  IndianRupee,
  Settings,
  Trophy,
} from 'lucide-react'
import type { ShellNavItem } from '../types'

export const teacherNavItems: ShellNavItem[] = [
  {
    to: '/dashboard/teacher',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
    placement: ['sidebar', 'tab'],
  },
  { to: '/dashboard/teacher/students', label: 'Students', icon: Users, placement: ['sidebar', 'tab'] },
  { to: '/dashboard/teacher/classes', label: 'Classes', icon: Video, placement: ['sidebar', 'tab'] },
  {
    to: '/dashboard/teacher/messages',
    label: 'Messages',
    icon: MessageCircle,
    badgeKey: 'messages',
    placement: ['sidebar', 'tab'],
  },
  { to: '/dashboard/teacher/schedule', label: 'Schedule', icon: Calendar, placement: ['sidebar', 'more'] },
  { to: '/dashboard/teacher/community', label: 'Community', icon: MessageSquare, placement: ['sidebar', 'more'] },
  {
    to: '/dashboard/teacher/notifications',
    label: 'Notifications',
    icon: Bell,
    badgeKey: 'notifications',
    placement: ['sidebar', 'more'],
  },
  { to: '/dashboard/teacher/coupons', label: 'Coupons', icon: Ticket, placement: ['sidebar', 'more'] },
  { to: '/dashboard/teacher/earnings', label: 'Earnings', icon: IndianRupee, placement: ['sidebar', 'more'] },
  { to: '/dashboard/teacher/competitions', label: 'Competitions', icon: Trophy, placement: ['sidebar', 'more'] },
  {
    to: '/dashboard/teacher/settings',
    label: 'Settings',
    icon: Settings,
    placement: ['sidebar', 'more'],
  },
]
