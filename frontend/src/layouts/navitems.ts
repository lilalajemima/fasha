import type { IconName } from '../components/Icon'

export type NavItem = { to: string; label: string; short: string; icon: IconName; end?: boolean }

// Taking part. Volunteer accounts only.
export const PARTICIPATE_NAV: NavItem[] = [
  { to: '/discover', label: 'Discover', short: 'Discover', icon: 'discover' },
  { to: '/activity', label: 'My activity', short: 'Activity', icon: 'activity' },
  { to: '/portfolio', label: 'My portfolio', short: 'Portfolio', icon: 'portfolio' },
  { to: '/profile', label: 'My profile', short: 'Profile', icon: 'profile' },
  { to: '/initiatives', label: 'My initiatives', short: 'Initiatives', icon: 'initiatives', end: true },
]

// Running opportunities. Both account types.
export const MANAGE_NAV: NavItem[] = [
  { to: '/manage', label: 'Overview', short: 'Overview', icon: 'overview', end: true },
  { to: '/manage/opportunities', label: 'Opportunities', short: 'Opportunities', icon: 'opportunities', end: true },
  { to: '/manage/review', label: 'Review workspace', short: 'Review', icon: 'review' },
  { to: '/manage/attendance', label: 'Attendance', short: 'Attendance', icon: 'attendance' },
]
