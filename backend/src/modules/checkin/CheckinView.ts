import { toCsv } from '../../core/export/csv'
import type { CheckinRecord } from './CheckinStore'

export type CheckinView = {
  id: string
  method: string
  checkedInAt: string
  checkedOutAt: string | null
  hours: number | null
  volunteer: { id: string; name: string }
  opportunity: { id: string; title: string }
}

export function hoursBetween(arrived: Date, left: Date): number {
  const hours = (left.getTime() - arrived.getTime()) / 3600000

  return Math.round(Math.max(hours, 0) * 100) / 100
}

export function toCheckinView(record: CheckinRecord): CheckinView {
  return {
    id: record.id,
    method: record.method,
    checkedInAt: record.checkinTime.toISOString(),
    checkedOutAt: record.checkoutTime ? record.checkoutTime.toISOString() : null,
    hours: record.checkoutTime ? hoursBetween(record.checkinTime, record.checkoutTime) : null,
    volunteer: record.volunteer,
    opportunity: { id: record.opportunity.id, title: record.opportunity.title },
  }
}

export function toAttendanceCsv(records: CheckinRecord[]): string {
  return toCsv(
    ['Volunteer', 'Date', 'Checked in', 'Checked out', 'Hours', 'How'],
    records.map(record => [
      record.volunteer.name,
      record.checkinTime.toISOString().slice(0, 10),
      record.checkinTime.toISOString().slice(11, 16),
      record.checkoutTime ? record.checkoutTime.toISOString().slice(11, 16) : '',
      record.checkoutTime
        ? hoursBetween(record.checkinTime, record.checkoutTime).toFixed(2)
        : '',
      record.method === 'QR' ? 'Scanned' : 'By hand',
    ]),
  )
}
