import type { TourStep } from '../../lib/tour'

/** What the community admin sees the first time they sign in. */
export const ADMIN_TOUR: TourStep[] = [
  {
    route: '/admin',
    targets: ['.counters', '.banner'],
    title: 'Welcome to Fasha!',
    body: "This is your community at a glance: what is waiting for you, how many volunteers and organisations have joined, and how much has happened. Users, in the menu, is where you manage people's accounts.",
  },
  {
    route: '/admin/approvals',
    targets: ['.review', '.banner'],
    title: 'Approve what residents propose',
    body: "Residents put forward their own initiatives, and nothing reaches volunteers until you approve it. If you reject one, say why in the feedback box: it goes back to the person who proposed it.",
  },
  {
    route: '/admin/approvals',
    targets: ['[data-tour="approval-filters"]', '.banner'],
    title: 'Look back at past decisions',
    body: 'Switch Showing to Approved or Rejected to see what you have already decided, and narrow it by interest, sector or period. The summary underneath counts whatever you choose.',
  },
  {
    route: '/admin/activity',
    targets: ['[data-tour="summary"]', '.banner'],
    title: 'See what happened, and when',
    body: 'Pick a period and this tells you how many people took part, how that compares with the period before, and which interests came up most. Download it as a report to share, or as a spreadsheet.',
  },
  {
    route: '/admin/activity',
    targets: ['[data-tour="event-report"]', '[data-tour="activity-downloads"]', '.banner'],
    title: 'One event on its own',
    body: 'Press Report on any row for a page about that one event, with everyone who checked in. You can take this tour again any time from the ? button.',
    next: 'Finish',
  },
]
