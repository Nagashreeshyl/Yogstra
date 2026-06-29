import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Layers,
  IndianRupee,
  UserCog,
  Calendar,
  ClipboardCheck,
  Trophy,
  Settings,
} from 'lucide-react'
import type { ShellNavItem } from '../types'

export const academyNavItems: ShellNavItem[] = [
  {
    to: '/dashboard/academy',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/academy/teachers',
    label: 'Teachers',
    icon: Users,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/academy/students',
    label: 'Students',
    icon: GraduationCap,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/academy/batches',
    label: 'Batches',
    icon: Layers,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/academy/timetable',
    label: 'Timetable',
    icon: Calendar,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/academy/attendance',
    label: 'Attendance',
    icon: ClipboardCheck,
    placement: ['sidebar', 'more'],
  },
  {
    to: '/dashboard/academy/competitions',
    label: 'Competitions',
    icon: Trophy,
    placement: ['sidebar', 'more'],
  },
  {
    to: '/dashboard/academy/finance',
    label: 'Finance',
    icon: IndianRupee,
    placement: ['sidebar', 'more'],
  },
  {
    to: '/dashboard/academy/members',
    label: 'Members',
    icon: UserCog,
    placement: ['sidebar', 'more'],
  },
  {
    to: '/dashboard/academy/settings',
    label: 'Settings',
    icon: Settings,
    placement: ['sidebar', 'more'],
  },
]
