import type { TourStep } from '../../lib/tour'

/** What a new organisation sees the first time it signs in, in the order it needs it. */
export const ORGANISER_TOUR: TourStep[] = [
  {
    route: '/profile',
    targets: ['[data-tour="profile-form"]'],
    title: 'Welcome to Fasha!',
    body: "Let's start with your organisation's profile. Add your name, a short description and a picture, so volunteers know who they'll be working with. Press Save changes when you're done.",
    next: "Done, what's next?",
  },
  {
    route: '/manage/opportunities',
    targets: ['[data-tour="create-opportunity"]'],
    title: 'Post your first opportunity',
    body: 'Say when and where it happens, how many people you need and which skills help. Fasha puts it in front of the volunteers who match it best.',
  },
  {
    route: '/manage/opportunities',
    targets: ['[data-tour="review-applicants"]', '.banner'],
    title: 'Choose who takes part',
    body: "When people apply, open Review applicants on that opportunity. Each person shows how well they match, and you accept or decline from there. Fasha won't let you accept more people than you have places for.",
  },
  {
    route: '/manage/attendance',
    targets: ['[data-tour="attendance"]', '.banner'],
    title: 'Check people in on the day',
    body: 'Open the event here and show its QR code. Volunteers scan it with their phone to check in, so there is no paper register to keep or lose.',
  },
  {
    route: '/manage/review',
    targets: ['[data-tour="deliverables"]', '.banner'],
    title: 'Accept work done online',
    body: 'For virtual tasks, volunteers send in what they did and the hours it took. Accept it here and those hours go onto their portfolio. You can take this tour again any time from the ? button.',
    next: 'Finish',
  },
]
