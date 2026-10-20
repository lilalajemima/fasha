export type Mode = 'Physical' | 'Virtual'
export type OpportunityStatus = 'PUBLISHED' | 'PENDING_APPROVAL' | 'REJECTED'
export type ApplicationStatus = 'Accepted' | 'Pending' | 'Rejected'
export type AttendanceStatus = 'Checked in' | 'Checked out' | 'Not arrived'

export type Opportunity = {
  id: string; title: string; organiser: string; mode: Mode; status: OpportunityStatus
  citizenLed: boolean; summary: string; description: string; tasks: string[]
  beforeYouArrive?: string; place: string; date: string; time: string; deadline: string
  capacity: number; filled: number; tags: string[]
}
export type Application = {
  id: string; opportunityId: string; title: string; organiser: string; when: string
  status: ApplicationStatus; note?: string
}
export type VirtualTask = { id: string; title: string; organiser: string; due: string; skill: string }
export type PortfolioEntry = {
  id: string; title: string; organiser: string; month: string; hours: number; skill: string
}
export type Profile = {
  name: string; location: string; bio: string; skills: string[]; interests: string[]
  days: string[]; preferredTime: string; participation: string
}
export type Attendee = {
  id: string; name: string; checkIn: string | null; checkOut: string | null; status: AttendanceStatus
}
export type ReviewApplication = {
  id: string; opportunity: string; submitted: string; name: string; location: string; bio: string
  availability: string; skills: string[]; interests: string[]; motivation: string
  attachment: string; match: number
}
export type Deliverable = {
  id: string; opportunity: string; submitted: string; name: string; hours: number; skill: string
  report: string; proofLink: string; proofFile: string
}

export type NotificationKind = 'application' | 'approval' | 'invite' | 'reminder' | 'review'
export type AppNotification = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  when: string
  read: boolean
  link?: string
}
