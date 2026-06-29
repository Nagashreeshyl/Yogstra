export type PublicNavLink = {
  to: string
  label: string
  end?: boolean
}

export const primaryPublicNav: PublicNavLink[] = [
  { to: '/discover', label: 'Discover' },
  { to: '/teachers', label: 'Teachers' },
  { to: '/academies', label: 'Academies' },
  { to: '/competitions', label: 'Competitions' },
  { to: '/community', label: 'Community' },
  { to: '/about', label: 'About' },
  { to: '/help', label: 'Help Center' },
]

export const footerNav = {
  platform: [
    { to: '/discover', label: 'Discover' },
    { to: '/teachers', label: 'Teachers' },
    { to: '/academies', label: 'Academies' },
    { to: '/competitions', label: 'Competitions' },
    { to: '/community', label: 'Community' },
  ],
  company: [
    { to: '/about', label: 'About' },
    { to: '/help', label: 'Help Center' },
    { to: '/how-it-works', label: 'How Yogstra Works' },
  ],
  legal: [
    { to: '/privacy-policy', label: 'Privacy' },
    { to: '/terms-of-service', label: 'Terms' },
    { to: '/refund-policy', label: 'Refund' },
  ],
} as const
