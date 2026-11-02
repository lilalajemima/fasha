import type { ActivityRow, AttendanceRow, AttendanceTally, InitiativeTally, RoleTally, SectorTally } from './AdminStore'

export type AdminSummary = {
  people: RoleTally
  initiatives: InitiativeTally & { approvalRate: number }
  attendance: AttendanceTally & { turnoutRate: number }
  sectors: SectorTally[]
}

function asPercentage(part: number, whole: number): number {
  if (whole === 0) return 0

  return Math.round((part / whole) * 100)
}

export function toSummary(
  people: RoleTally,
  initiatives: InitiativeTally,
  attendance: AttendanceTally,
  sectors: SectorTally[],
): AdminSummary {
  const reviewed = initiatives.citizenApproved + initiatives.citizenRejected

  return {
    people,
    initiatives: {
      ...initiatives,
      approvalRate: asPercentage(initiatives.citizenApproved, reviewed),
    },
    attendance: {
      ...attendance,
      turnoutRate: asPercentage(attendance.checkedIn, attendance.acceptedPlaces),
    },
    sectors,
  }
}

function escapeCell(value: string): string {
  if (!/[",\n]/.test(value)) return value

  return `"${value.replace(/"/g, '""')}"`
}

function hoursBetween(arrived: Date, left: Date | null): string {
  if (!left) return ''

  return (Math.round(((left.getTime() - arrived.getTime()) / 3600000) * 100) / 100).toFixed(2)
}

export function toCsv(rows: AttendanceRow[]): string {
  const header = ['Date', 'Sector', 'Opportunity', 'Volunteer', 'Checked in', 'Checked out', 'Hours', 'Method']

  const body = rows.map(row =>
    [
      row.checkedInAt.toISOString().slice(0, 10),
      row.sector ?? '',
      row.opportunityTitle,
      row.volunteerName,
      row.checkedInAt.toISOString().slice(11, 16),
      row.checkedOutAt ? row.checkedOutAt.toISOString().slice(11, 16) : '',
      hoursBetween(row.checkedInAt, row.checkedOutAt),
      row.method === 'QR' ? 'Scanned' : 'By hand',
    ]
      .map(escapeCell)
      .join(','),
  )

  return [header.join(','), ...body].join('\n')
}

export type ActivityView = ActivityRow

export function toActivity(rows: ActivityRow[]): ActivityView[] {
  return rows
}
