export type RoleTally = { volunteers: number; organisations: number }

export type InitiativeTally = {
  published: number
  citizenProposed: number
  citizenApproved: number
  citizenRejected: number
  awaitingReview: number
}

export type AttendanceTally = {
  acceptedPlaces: number
  checkedIn: number
  scanned: number
  byHand: number
  hoursCredited: number
}

export type SectorTally = { sector: string; opportunities: number }

export type ActivityRow = {
  id: string
  title: string
  sector: string | null
  organiser: string
  organiserRole: string
  status: string
  applications: number
  accepted: number
  checkedIn: number
}

export type AttendanceRow = {
  checkedInAt: Date
  checkedOutAt: Date | null
  method: string
  volunteerName: string
  opportunityTitle: string
  sector: string | null
}

export interface AdminStore {
  countRoles(): Promise<RoleTally>
  countInitiatives(): Promise<InitiativeTally>
  countAttendance(): Promise<AttendanceTally>
  countBySector(): Promise<SectorTally[]>
  listActivity(): Promise<ActivityRow[]>
  listAttendance(from: Date, to: Date): Promise<AttendanceRow[]>
}
