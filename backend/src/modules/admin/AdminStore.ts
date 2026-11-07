export type Window = { from: Date; to: Date }

export type PeriodTally = {
  opportunitiesPosted: number
  citizenProposed: number
  published: number
  acceptedPlaces: number
  checkedIn: number
  hoursCredited: number
}

export type SectorTally = { sector: string | null; opportunities: number }

export type ActivityRow = {
  id: string
  title: string
  description: string
  sector: string | null
  location: string | null
  mode: string
  organiser: string
  organiserRole: string
  status: string
  postedAt: Date
  happenedAt: Date
  applications: number
  accepted: number
  checkedIn: number
  delivered: number
}

export type AttendanceRow = {
  checkedInAt: Date
  checkedOutAt: Date | null
  method: string
  volunteerName: string
  opportunityTitle: string
  mode: string
  sector: string | null
}

export type ReportFilter = {
  from: Date
  to: Date
  mode: 'PHYSICAL' | 'VIRTUAL' | null
  sector: string | null
}

export interface AdminStore {
  tally(window: Window): Promise<PeriodTally>
  countAwaitingReview(): Promise<number>
  countBySector(window: Window): Promise<SectorTally[]>
  listEvents(filter: ReportFilter): Promise<ActivityRow[]>
  listCheckins(filter: ReportFilter): Promise<AttendanceRow[]>
}
