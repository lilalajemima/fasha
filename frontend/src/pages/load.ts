import type { Role } from '../auth/AuthContext'

// Every page behind a sign-in, as a function that fetches its code. App.tsx
// makes the routes from these, and the same functions fetch a workspace ahead
// of time, so the two can never ask for different files.
export const load = {
  shell: () => import('../layouts/Shell'),
  notifications: () => import('./Notifications'),
  profile: () => import('./Profile'),

  discover: () => import('./volunteer/Discover'),
  opportunityDetail: () => import('./volunteer/OpportunityDetail'),
  myActivity: () => import('./volunteer/MyActivity'),
  myInitiatives: () => import('./volunteer/MyInitiatives'),
  myInitiative: () => import('./volunteer/MyInitiative'),
  createOpportunity: () => import('./volunteer/CreateOpportunity'),
  portfolio: () => import('./volunteer/Portfolio'),
  checkIn: () => import('./volunteer/CheckIn'),

  manageOverview: () => import('./manage/Overview'),
  opportunities: () => import('./manage/Opportunities'),
  applicants: () => import('./manage/Applicants'),
  deliverables: () => import('./manage/Deliverables'),
  attendance: () => import('./manage/Attendance'),

  adminOverview: () => import('./admin/Overview'),
  approvals: () => import('./admin/Approvals'),
  users: () => import('./admin/Users'),
  adminActivity: () => import('./admin/Activity'),
}

// What each kind of account can open. Check-in is on the volunteer's list on
// purpose: it is used at the event, where the signal is often worst.
const WORKSPACE: Record<Role, (keyof typeof load)[]> = {
  volunteer: [
    'shell', 'discover', 'opportunityDetail', 'myActivity', 'myInitiatives', 'myInitiative',
    'createOpportunity', 'portfolio', 'checkIn', 'notifications', 'profile',
  ],
  organisation: [
    'shell', 'manageOverview', 'opportunities', 'createOpportunity', 'applicants',
    'deliverables', 'attendance', 'notifications', 'profile',
  ],
  admin: ['shell', 'adminOverview', 'approvals', 'users', 'adminActivity', 'notifications', 'profile'],
}

/**
 * Fetches the rest of somebody's workspace in the background. Moving between
 * pages then never waits, and the service worker has every page kept for when
 * the connection drops. A failure here is ignored: the page is simply fetched
 * again when it is opened.
 */
export function fetchWorkspace(role: Role): void {
  for (const page of WORKSPACE[role]) {
    load[page]().catch(() => undefined)
  }
}
