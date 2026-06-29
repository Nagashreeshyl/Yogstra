export type PublicNavLink = {
  to: string
  label: string
  end?: boolean
}

export const primaryPublicNav: PublicNavLink[] = [
  { to: '/explore', label: 'Explore' },
  { to: '/teachers', label: 'Teachers' },
  { to: '/academies', label: 'Academies' },
  { to: '/competitions', label: 'Competitions' },
  { to: '/community', label: 'Community' },
  { to: '/pricing', label: 'Pricing' },
]

export const resourcePublicNav: PublicNavLink[] = [
  { to: '/help', label: 'Help Center' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export const footerNav = {
  company: [
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
    { to: '/pricing', label: 'Pricing' },
  ],
  platform: [
    { to: '/explore', label: 'Explore' },
    { to: '/teachers', label: 'Teachers' },
    { to: '/academies', label: 'Academies' },
    { to: '/competitions', label: 'Competitions' },
    { to: '/community', label: 'Community' },
  ],
  resources: [
    { to: '/help', label: 'Help Center' },
    { to: '/shop', label: 'Shop' },
  ],
  legal: [
    { to: '/privacy-policy', label: 'Privacy Policy' },
    { to: '/terms-of-service', label: 'Terms of Service' },
    { to: '/refund-policy', label: 'Refund Policy' },
  ],
} as const
