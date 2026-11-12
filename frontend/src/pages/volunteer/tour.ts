import type { TourStep } from '../../lib/tour'

/** What a new volunteer sees the first time they sign in, in the order they need it. */
export const VOLUNTEER_TOUR: TourStep[] = [
  {
    route: '/profile',
    targets: ['[data-tour="profile-form"]'],
    title: 'Welcome to Fasha!',
    body: "Let's start by creating your profile. Add a short bio, then pick your skills and the causes you care about, because Fasha uses them to find work that fits you. Press Save changes when you're done.",
    next: "Done, what's next?",
  },
  {
    route: '/discover',
    targets: ['[data-tour="listing"]', '.banner'],
    title: 'Opportunities picked for you',
    body: "These are the opportunities open right now, with your best matches first. The percentage shows how well each one fits your skills and interests. Open one to read the details, then apply with a short note on why you'd like to take part.",
  },
  {
    route: '/discover',
    targets: ['[data-tour="propose"]', '.banner'],
    title: "Can't find one that fits?",
    body: 'Then create your own. Propose an initiative, an admin checks it, and it goes out to volunteers like any other opportunity.',
  },
  {
    route: '/activity',
    targets: ['[role="tablist"]', '.banner'],
    title: 'Keep track of it all',
    body: "Everything you apply for lands in My activity. You'll see when you're accepted, check in with a code on the day, and send in your work for virtual tasks.",
  },
  {
    route: '/portfolio',
    targets: ['.pf-banner', '.banner'],
    title: 'Your hours, on the record',
    body: 'Every hour an organiser approves is added to your portfolio, a page you can share with an employer or a scholarship panel. You can take this tour again any time from the ? button.',
    next: 'Finish',
  },
]
