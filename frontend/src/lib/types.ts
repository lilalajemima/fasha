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
  maxCapacity: number
  applicationDeadline: string
  status: OpportunityStatus
  requiredSkills: string[]
  categories: string[]
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
  volunteer: { id: string; name: string; email: string }
  opportunity: { id: string; title: string; applicationDeadline: string }
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
  createdAt: string
  volunteer: { id: string; name: string }
  opportunity: { id: string; title: string }
}

export type ProfileView = {
  user: { id: string; name: string; email: string; role: ServerRole }
  profile: {
    skills: string[]
    interests: string[]
    availability: string | null
    location: string | null
    portfolioSlug: string
  } | null
}

export type PortfolioView = {
  volunteer: { name: string; portfolioSlug: string }
  totals: { hours: number; opportunities: number; skills: string[] }
  entries: {
    id: string
    hours: number
    skills: string[]
    creditedOn: string
    opportunity: { id: string; title: string; mode: OpportunityMode }
  }[]
}
