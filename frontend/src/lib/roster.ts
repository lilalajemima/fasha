import type { ApplicationView, CheckinView } from './types'

/**
 * The attendance list for one event. Everyone accepted onto the event belongs
 * on it whether or not they have turned up, so the register is built by joining
 * the accepted applications to whatever check-ins exist.
 */

export type RosterRow = {
  volunteerId: string
  name: string
  checkinId: string | null
  checkedInAt: string | null
  checkedOutAt: string | null
  method: 'QR' | 'MANUAL' | null
  hours: number | null
}

function rowFor(volunteerId: string, name: string, entry?: CheckinView): RosterRow {
  if (!entry) {
    return {
      volunteerId,
      name,
      checkinId: null,
      checkedInAt: null,
      checkedOutAt: null,
      method: null,
      hours: null,
    }
  }

  return {
    volunteerId,
    name,
    checkinId: entry.id,
    checkedInAt: entry.checkedInAt,
    checkedOutAt: entry.checkedOutAt,
    method: entry.method,
    hours: entry.hours,
  }
}

/** An open check-in is the one that matters, so it wins over a closed one. */
function index(checkins: CheckinView[]): Map<string, CheckinView> {
  const byVolunteer = new Map<string, CheckinView>()

  for (const entry of checkins) {
    const held = byVolunteer.get(entry.volunteer.id)

    if (!held || held.checkedOutAt) byVolunteer.set(entry.volunteer.id, entry)
  }

  return byVolunteer
}

export function buildRoster(accepted: ApplicationView[], checkins: CheckinView[]): RosterRow[] {
  const byVolunteer = index(checkins)
  const rows = accepted.map(application => {
    const entry = byVolunteer.get(application.volunteer.id)

    byVolunteer.delete(application.volunteer.id)

    return rowFor(application.volunteer.id, application.volunteer.name, entry)
  })

  // Anybody who checked in without an accepted place still has to appear.
  for (const entry of byVolunteer.values()) {
    rows.push(rowFor(entry.volunteer.id, entry.volunteer.name, entry))
  }

  return rows.sort((a, b) => a.name.localeCompare(b.name))
}

export function matches(row: RosterRow, query: string): boolean {
  return row.name.toLowerCase().includes(query.trim().toLowerCase())
}
