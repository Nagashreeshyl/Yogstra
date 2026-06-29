import {
  LayoutDashboard,
  Trophy,
  Gavel,
  Medal,
  Award,
  FileText,
} from 'lucide-react'
import { TERMS } from '../../../constants/terminology'
import type { ShellNavItem } from '../types'

/** Competition workspace navigation */
export const competitionNavItems: ShellNavItem[] = [
  {
    to: '/dashboard/organizer',
    label: 'Dashboard',
    icon: LayoutDashboard,
    end: true,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/competitions',
    label: TERMS.competitions,
    icon: Trophy,
    placement: ['sidebar', 'tab'],
  },
  {
    to: '/dashboard/judge',
    label: TERMS.judgeWorkspace,
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
    label: TERMS.certificates,
    icon: FileText,
    placement: ['sidebar', 'more'],
  },
]
