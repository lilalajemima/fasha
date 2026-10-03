import type {
  Application, Attendee, Deliverable, Opportunity, PortfolioEntry, Profile, ReviewApplication, VirtualTask,
} from './types'

/** Sample content for the Kimironko pilot. Replaced by API data in the integration sprint. */

export const opportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Restore Kimironko wetland path',
    organiser: 'Green Neighbourhood',
    mode: 'Physical',
    status: 'PUBLISHED',
    citizenLed: false,
    summary: 'Help plant native trees and bring a much-loved green space back to life.',
    description:
      'Join our neighbourhood team to plant native trees, clear paths and restore the wetland garden. ' +
      'No gardening experience is needed, we provide tools and a friendly introduction.',
    tasks: ['Plant saplings and mulch garden beds', 'Work with a small team to tidy the path',
            'Welcome neighbours and share planting tips'],
    beforeYouArrive: 'Meet at the east gate at 08:50. Wear closed shoes and bring water. ' +
                     'Tools, gloves and a short safety briefing are provided.',
    place: 'Kimironko wetland, Gasabo',
    date: 'Sat, 17 Oct 2026',
    time: '09:00-12:00',
    deadline: '14 Oct, 23:59',
    capacity: 20,
    filled: 12,
    tags: ['Teamwork', 'Environment', 'Outdoors'],
  },
  {
    id: '2',
    title: 'Design a community reading guide',
    organiser: 'Open Book Collective',
    mode: 'Virtual',
    status: 'PUBLISHED',
    citizenLed: false,
    summary: 'Create an accessible reading guide for our after-school programme.',
    description: 'Lay out a short guide that volunteers can print and hand to parents.',
    tasks: ['Draft the layout', 'Check the reading level', 'Export an accessible PDF'],
    place: 'Remote',
    date: 'Flexible',
    time: 'Deliver by 25 Oct',
    deadline: '18 Oct, 23:59',
    capacity: 6,
    filled: 3,
    tags: ['Graphic design', 'Education'],
  },
  {
    id: '3',
    title: 'Saturday food parcels',
    organiser: 'Kimironko Community Kitchen',
    mode: 'Physical',
    status: 'PUBLISHED',
    citizenLed: false,
    summary: 'Sort donations and prepare welcoming food parcels for local families.',
    description: 'Pack and label parcels, then help families collect them.',
    tasks: ['Sort donations', 'Pack parcels', 'Welcome families'],
    place: 'Kimironko Market hall',
    date: 'Sat, 24 Oct 2026',
    time: '10:00-13:00',
    deadline: '20 Oct, 23:59',
    capacity: 18,
    filled: 12,
    tags: ['Teamwork', 'Food access'],
  },
  {
    id: '4',
    title: 'Community repair cafe',
    organiser: 'Kimironko Makers',
    mode: 'Physical',
    status: 'PUBLISHED',
    citizenLed: false,
    summary: 'Fix small appliances with neighbours.',
    description: 'Bring your tools and help people repair what they already own.',
    tasks: ['Repair small items', 'Show people the basics'],
    place: 'Kimironko youth centre',
    date: 'Sat, 7 Nov 2026',
    time: '14:00-17:00',
    deadline: '1 Nov, 23:59',
    capacity: 20,
    filled: 20,
    tags: ['Teamwork', 'Repair'],
  },
  {
    id: '5',
    title: 'Kimironko seed swap',
    organiser: 'Amara Mensah',
    mode: 'Physical',
    status: 'PENDING_APPROVAL',
    citizenLed: true,
    summary: 'Help neighbours exchange seeds and learn about growing food locally.',
    description: 'Volunteers will welcome visitors, label seed packets and set up tables at the community garden.',
    tasks: ['Welcome visitors', 'Label seed packets', 'Set up tables'],
    place: 'Kimironko community garden',
    date: 'Sat, 31 Oct 2026',
    time: '10:00-13:00',
    deadline: '28 Oct, 23:59',
    capacity: 15,
    filled: 0,
    tags: ['Teamwork', 'Environment', 'Gardening'],
  },
]

export const myProfile: Profile = {
  name: 'Amara Mensah',
  location: 'Kimironko, Kigali',
  bio: 'Designer, weekend gardener and believer in stronger neighbourhoods. I enjoy making useful things with others.',
  skills: ['Graphic design', 'Teamwork', 'Communication'],
  interests: ['Environment', 'Education', 'Food access'],
  days: ['Sat', 'Sun'],
  preferredTime: 'Mornings - 08:00-13:00',
  participation: 'Physical & virtual',
  completeness: 90,
}

export const myApplications: Application[] = [
  { id: 'a1', opportunityId: '1', title: 'Kimironko planting morning', organiser: 'Green Neighbourhood',
    when: '10 Oct - 09:00-12:00', status: 'Accepted' },
  { id: 'a2', opportunityId: '2', title: 'Design a community reading guide', organiser: 'Open Book Collective',
    when: 'Applied 8 Oct - Remote', status: 'Pending' },
  { id: 'a3', opportunityId: '4', title: 'Community repair cafe', organiser: 'Kimironko Makers',
    when: 'Updated 7 Oct', status: 'Rejected', note: 'The team filled this role. You can still find other opportunities.' },
]

export const myTask: VirtualTask = {
  id: 't1',
  title: 'Translate the community welcome pack',
  organiser: 'Open Book Collective',
  due: '15 Oct',
  skill: 'Translation',
}

export const myPortfolio: PortfolioEntry[] = [
  { id: 'p1', title: 'Community garden weekends', organiser: 'Green Neighbourhood', month: 'Sep 2026', hours: 12, skill: 'Teamwork' },
  { id: 'p2', title: 'Umuganda food support', organiser: 'Kimironko Community Kitchen', month: 'Aug 2026', hours: 10, skill: 'Teamwork' },
  { id: 'p3', title: 'Neighbourhood welcome day', organiser: 'Kimironko Community Hub', month: 'Aug 2026', hours: 8, skill: 'Communication' },
  { id: 'p4', title: 'Youth learning workshop', organiser: 'Open Book Collective', month: 'Jul 2026', hours: 8, skill: 'Communication' },
  { id: 'p5', title: 'Park planting afternoon', organiser: 'Green Neighbourhood', month: 'Jun 2026', hours: 6, skill: 'Teamwork' },
  { id: 'p6', title: 'Community reading guide', organiser: 'Open Book Collective', month: 'Sep 2026', hours: 4, skill: 'Graphic design' },
]

export const attendees: Attendee[] = [
  { id: 'v1', name: 'Amara Mensah', checkIn: '09:02', checkOut: null, status: 'Checked in' },
  { id: 'v2', name: 'Noah Kimenyi', checkIn: '08:58', checkOut: '11:59', status: 'Checked out' },
  { id: 'v3', name: 'Leila Hassan', checkIn: '09:05', checkOut: null, status: 'Checked in' },
  { id: 'v4', name: 'Samuel Karera', checkIn: null, checkOut: null, status: 'Not arrived' },
  { id: 'v5', name: 'Maya Uwase', checkIn: '09:01', checkOut: '12:02', status: 'Checked out' },
]

export const reviewApplications: ReviewApplication[] = [
  {
    id: 'r1', opportunity: 'Restore Kimironko wetland path', submitted: '8 Oct',
    name: 'Amara Mensah', location: 'Kimironko, Kigali',
    bio: 'Designer, weekend gardener and believer in stronger neighbourhoods.',
    availability: 'Weekend mornings',
    skills: ['Graphic design', 'Teamwork', 'Communication'],
    interests: ['Environment', 'Education', 'Food access'],
    motivation: 'I would love to help care for the wetland I walk through every day. ' +
                'I am comfortable working in teams and can stay for the full morning.',
    attachment: 'Amara_Mensah_portfolio.pdf', match: 96,
  },
]

export const deliverables: Deliverable[] = [
  {
    id: 'd1', opportunity: 'Community welcome pack', submitted: '9 Oct',
    name: 'Noah Kimenyi', hours: 3.5, skill: 'Translation',
    report: 'Translated the 6-page welcome pack into Kinyarwanda, checked the reading level ' +
            'and incorporated the organiser feedback. The final file includes accessible headings and a glossary.',
    proofLink: 'docs.example.org/welcome-rw', proofFile: 'welcome-pack-rw.pdf',
  },
]
