import { toCsv as writeCsv } from '../../core/export/csv'
import type { ActivityRow, AttendanceRow, PeriodTally, SectorTally } from './AdminStore'

export type AdminSummary = {
  days: number
  from: string
  to: string
  current: PeriodTally
  previous: PeriodTally
  comparable: boolean
  awaitingReview: number
  sectors: SectorTally[]
}

export type ActivityView = {
  id: string
  title: string
  sector: string | null
  location: string | null
  mode: string
  organiser: string
  organiserRole: string
  status: string
  postedAt: string
  happenedAt: string
  applications: number
  accepted: number
  checkedIn: number
  delivered: number
}

export function toActivity(rows: ActivityRow[]): ActivityView[] {
  return rows.map(row => ({
    id: row.id,
    title: row.title,
    sector: row.sector,
    location: row.location,
    mode: row.mode,
    organiser: row.organiser,
    organiserRole: row.organiserRole,
    status: row.status,
    postedAt: row.postedAt.toISOString(),
    happenedAt: row.happenedAt.toISOString(),
    applications: row.applications,
    accepted: row.accepted,
    checkedIn: row.checkedIn,
    delivered: row.delivered,
  }))
}

function day(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function clock(date: Date): string {
  return date.toISOString().slice(11, 16)
}

function hoursBetween(arrived: Date, left: Date | null): string {
  if (!left) return ''

  return (Math.round(((left.getTime() - arrived.getTime()) / 3600000) * 100) / 100).toFixed(2)
}

function kind(mode: string): string {
  return mode === 'VIRTUAL' ? 'Virtual' : 'In person'
}

export function toEventsCsv(rows: ActivityRow[]): string {
  return writeCsv(
    [
      'Date',
      'Opportunity',
      'Type',
      'Sector',
      'Location',
      'Organiser',
      'Organiser type',
      'Status',
      'Applied',
      'Accepted',
      'Turned up',
      'Deliverables accepted',
    ],
    rows.map(row => [
      day(row.happenedAt),
      row.title,
      kind(row.mode),
      row.sector ?? '',
      row.location ?? '',
      row.organiser,
      row.organiserRole === 'VOLUNTEER' ? 'Citizen initiative' : 'Organisation',
      row.status === 'PENDING_APPROVAL' ? 'Awaiting review' : row.status === 'PUBLISHED' ? 'Published' : 'Not approved',
      String(row.applications),
      String(row.accepted),
      String(row.checkedIn),
      String(row.delivered),
    ]),
  )
}

export function toCheckinsCsv(rows: AttendanceRow[]): string {
  return writeCsv(
    ['Date', 'Sector', 'Opportunity', 'Type', 'Volunteer', 'Checked in', 'Checked out', 'Hours', 'Method'],
    rows.map(row => [
      day(row.checkedInAt),
      row.sector ?? '',
      row.opportunityTitle,
      kind(row.mode),
      row.volunteerName,
      clock(row.checkedInAt),
      row.checkedOutAt ? clock(row.checkedOutAt) : '',
      hoursBetween(row.checkedInAt, row.checkedOutAt),
      row.method === 'QR' ? 'Scanned' : 'By hand',
    ]),
  )
}
