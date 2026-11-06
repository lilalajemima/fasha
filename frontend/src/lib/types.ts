export type ServerRole = 'VOLUNTEER' | 'ORGANISATION' | 'ADMIN'
export type OpportunityMode = 'PHYSICAL' | 'VIRTUAL'
export type OpportunityStatus = 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED'
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
export type SubmissionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type OpportunityView = {
  id: string
  title: string
  description: string
  mode: OpportunityMode
  location: string | null
  sector: string | null
  maxCapacity: number
  applicationDeadline: string
  startsAt: string | null
  endsAt: string | null
  status: OpportunityStatus
  reviewNote: string | null
  requiredSkills: string[]
  categories: string[]
  /** An optional PDF with more detail; the url is an API path. */
  brief: { name: string; url: string } | null
  createdAt: string
  creator: { id: string; name: string; role: ServerRole }
  matchScore?: number
}

export type ApplicationView = {
  id: string
  status: ApplicationStatus
  motivationStatement: string
  resumeUrl: string | null
  createdAt: string
  volunteer: {
    id: string
    name: string
    email: string
    avatar: string | null
    portfolioSlug: string | null
    skills: string[]
    interests: string[]
    availabilitySlots: string[]
    location: string | null
  }
  /** How well they fit this opportunity, and which tags they share with it. */
  match: { score: number; sharedSkills: string[]; sharedInterests: string[] }
  opportunity: {
    id: string
    title: string
    applicationDeadline: string
    mode: OpportunityMode
  }
}

export type CheckinView = {
  id: string
  method: 'QR' | 'MANUAL'
  checkedInAt: string
  checkedOutAt: string | null
  hours: number | null
  volunteer: { id: string; name: string }
  opportunity: { id: string; title: string }
}

export type CheckinCodeView = {
  code: string
  secondsRemaining: number
  payload: string
  qrSvg: string
}

export type SubmissionView = {
  id: string
  status: SubmissionStatus
  hoursClaimed: number
  proofUrl: string
  /** Why it was turned down, written by the organiser. Null unless it was. */
  reviewNote: string | null
  createdAt: string
  volunteer: { id: string; name: string }
  opportunity: { id: string; title: string }
}

export type UserStatus = 'ACTIVE' | 'DEACTIVATED' | 'DELETED'

/** One account as the community admin's user management table shows it. */
export type UserView = {
  id: string
  name: string
  email: string
  role: ServerRole
  status: UserStatus
  mustChangePassword: boolean
  createdAt: string
  deactivatedAt: string | null
}

export type ProfileView = {
  user: {
    id: string
    name: string
    email: string
    role: ServerRole
    status: UserStatus
    mustChangePassword: boolean
    avatar: string | null
    bio: string | null
  }
  profile: {
    skills: string[]
    interests: string[]
    availabilitySlots: string[]
    location: string | null
    sector: string | null
    portfolioSlug: string
  } | null
}

export type PortfolioBrief = { name: string; url: string }

export type PortfolioEntryView = {
  id: string
  hours: number
  skills: string[]
  creditedOn: string
  opportunity: {
    id: string
    title: string
    description: string
    mode: OpportunityMode
    organiser: string
    requiredSkills: string[]
    categories: string[]
    brief: PortfolioBrief | null
  }
}

export type OrganisedView = {
  id: string
  title: string
  description: string
  mode: OpportunityMode
  sector: string | null
  location: string | null
  happenedOn: string | null
  requiredSkills: string[]
  categories: string[]
  people: number
  brief: PortfolioBrief | null
}

export type PortfolioView = {
  volunteer: {
    name: string
    portfolioSlug: string
    avatar: string | null
    bio: string | null
    skills: string[]
    interests: string[]
    availabilitySlots: string[]
  }
  totals: { hours: number; opportunities: number; organised: number; skills: string[] }
  entries: PortfolioEntryView[]
  organised: OrganisedView[]
}

export type NotificationView = {
  id: string
  type: string
  message: string
  isRead: boolean
  createdAt: string
}

export type NotificationFeed = {
  unread: number
  items: NotificationView[]
}

export type PeriodTally = {
  opportunitiesPosted: number
  citizenProposed: number
  published: number
  acceptedPlaces: number
  checkedIn: number
  hoursCredited: number
}

export type AdminSummary = {
  days: number
  from: string
  to: string
  current: PeriodTally
  previous: PeriodTally
  comparable: boolean
  awaitingReview: number
  sectors: { sector: string | null; opportunities: number }[]
}

export type ActivityRow = {
  id: string
  title: string
  sector: string | null
  location: string | null
  mode: OpportunityMode
  organiser: string
  organiserRole: ServerRole
  status: OpportunityStatus
  postedAt: string
  happenedAt: string
  applications: number
  accepted: number
  checkedIn: number
  delivered: number
}

export type WorkloadRow = {
  opportunityId: string
  pendingApplications: number
  acceptedApplications: number
  pendingDeliverables: number
}