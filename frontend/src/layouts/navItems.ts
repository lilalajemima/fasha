import type { IconName } from '../components/Icon'

export type NavItem = { to: string; label: string; short: string; icon: IconName; end?: boolean }

/** Taking part. Volunteer accounts only. The portfolio is reached from the profile. */
export const PARTICIPATE_NAV: NavItem[] = [
  { to: '/discover', label: 'Discover', short: 'Discover', icon: 'discover' },
  { to: '/activity', label: 'My activity', short: 'Activity', icon: 'activity' },
  { to: '/initiatives', label: 'My initiatives', short: 'Initiatives', icon: 'initiatives', end: true },
  { to: '/profile', label: 'My profile', short: 'Profile', icon: 'profile' },
]

/** Running opportunities. Organisation accounts only — a volunteer gets these
 *  tools inside their own initiative instead. */
export const MANAGE_NAV: NavItem[] = [
  { to: '/manage', label: 'Overview', short: 'Overview', icon: 'overview', end: true },
  { to: '/manage/opportunities', label: 'Opportunities', short: 'Opportunities', icon: 'opportunities', end: true },
  { to: '/manage/review', label: 'Deliverables', short: 'Deliverables', icon: 'review' },
  { to: '/manage/attendance', label: 'Attendance', short: 'Attendance', icon: 'attendance' },
]