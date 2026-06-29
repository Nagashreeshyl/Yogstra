import {
  LayoutDashboard,
  Trophy,
  Gavel,
  Medal,
  Award,
  FileText,
} from 'lucide-react'
import type { ShellNavItem } from '../types'

/** Competition foundation routes — organizer, judge, results */
export const competitionNavItems: ShellNavItem[] = [
  {
    to: '/dashboard/organizer',
    label: 'Organizer',
    icon: LayoutDashboard,
    end: true,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/competitions',
    label: 'Competitions',
    icon: Trophy,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/judge',
    label: 'Judge',
    icon: Gavel,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/results',
    label: 'Results',
    icon: Medal,
    placement: ['sidebar', 'more'],
  },
  {
    to: '/dashboard/rankings',
    label: 'Rankings',
    icon: Award,
    placement: ['sidebar', 'more'],
  },
  {
    to: '/dashboard/certificates',
    label: 'Certificates',
    icon: FileText,
    placement: ['sidebar', 'more'],
  },
]
