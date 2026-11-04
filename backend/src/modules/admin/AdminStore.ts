/** A closed period of time. Everything the oversight page counts is counted inside one. */
export type Window = { from: Date; to: Date }

/** The numbers for one window, so two windows can be compared. */
export type PeriodTally = {
  opportunitiesPosted: number
  citizenProposed: number
  published: number
  acceptedPlaces: number
  checkedIn: number
  hoursCredited: number
}

/** `sector: null` means the opportunity never had one, which the page says in its own words. */
export type SectorTally = { sector: string | null; opportunities: number }

/**
 * One opportunity with the people around it. The same row is what the activity
 * table shows and what the events export writes.
 */
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

/** What the district is asking for: a period, and optionally one kind or one place. */
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
