import type { Role } from '../auth/AuthContext'
import type { IconName } from '../components/Icon'

export type NavItem = { to: string; label: string; short: string; icon: IconName; end?: boolean }

export const PARTICIPATE_NAV: NavItem[] = [
  { to: '/discover', label: 'Discover', short: 'Discover', icon: 'discover' },
  { to: '/activity', label: 'My activity', short: 'Activity', icon: 'activity' },
  { to: '/initiatives', label: 'My initiatives', short: 'Initiatives', icon: 'initiatives', end: true },
  { to: '/profile', label: 'My profile', short: 'Profile', icon: 'profile' },
]

export const MANAGE_NAV: NavItem[] = [
  { to: '/manage', label: 'Overview', short: 'Overview', icon: 'overview', end: true },
  { to: '/manage/opportunities', label: 'Opportunities', short: 'Opportunities', icon: 'opportunities', end: true },
  { to: '/manage/review', label: 'Deliverables', short: 'Deliverables', icon: 'review' },
  { to: '/manage/attendance', label: 'Attendance', short: 'Attendance', icon: 'attendance' },
  { to: '/profile', label: 'Profile', short: 'Profile', icon: 'profile' },
]

export const OVERSIGHT_NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', short: 'Overview', icon: 'overview', end: true },
  { to: '/admin/approvals', label: 'Approvals', short: 'Approvals', icon: 'review' },
  { to: '/admin/activity', label: 'Activity', short: 'Activity', icon: 'activity' },
  { to: '/admin/users', label: 'Users', short: 'Users', icon: 'users' },
  { to: '/profile', label: 'Profile', short: 'Profile', icon: 'profile' },
]

// One workspace per role. The shell and the mobile drawer both read this, so
// a destination can never appear in one and be missing from the other.
export const WORKSPACE_NAV: Record<Role, NavItem[]> = {
  volunteer: PARTICIPATE_NAV,
  organisation: MANAGE_NAV,
  admin: OVERSIGHT_NAV,
}

export const WORKSPACE_LABEL: Record<Role, string> = {
  volunteer: 'Volunteer',
  organisation: 'Organiser',
  admin: 'Community admin',
}

export function workspaceFor(role: Role | undefined): Role {
  return role === 'organisation' || role === 'admin' ? role : 'volunteer'
}
