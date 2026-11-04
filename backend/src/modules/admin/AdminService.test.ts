import { describe, expect, it } from 'vitest'
import { AdminService } from './AdminService'
import type {
  ActivityRow,
  AdminStore,
  AttendanceRow,
  PeriodTally,
  ReportFilter,
  SectorTally,
  Window,
} from './AdminStore'

const DAY = 24 * 60 * 60 * 1000

function tallyOf(overrides: Partial<PeriodTally> = {}): PeriodTally {
  return {
    opportunitiesPosted: 0,
    citizenProposed: 0,
    published: 0,
    acceptedPlaces: 0,
    checkedIn: 0,
    hoursCredited: 0,
    ...overrides,
  }
}

function eventOf(overrides: Partial<ActivityRow> = {}): ActivityRow {
  return {
    id: 'opportunity-1',
    title: 'Restore the wetland path',
    description: 'Plant trees with the neighbourhood team.',
    sector: 'Kimironko',
    location: 'Kimironko wetland',
    mode: 'PHYSICAL',
    organiser: 'Green Neighbourhood',
    organiserRole: 'ORGANISATION',
    status: 'PUBLISHED',
    postedAt: new Date('2026-10-01T08:00:00.000Z'),
    happenedAt: new Date('2026-10-18T08:00:00.000Z'),
    applications: 12,
    accepted: 9,
    checkedIn: 7,
    delivered: 0,
    ...overrides,
  }
}

class FakeReports implements AdminStore {
  readonly windows: Window[] = []
  readonly filters: ReportFilter[] = []
  readonly events: ActivityRow[]
  readonly checkins: AttendanceRow[]

  constructor(events: ActivityRow[] = [], checkins: AttendanceRow[] = []) {
    this.events = events
    this.checkins = checkins
  }

  async tally(window: Window): Promise<PeriodTally> {
    this.windows.push(window)

    return tallyOf({ checkedIn: this.windows.length })
  }

  async countAwaitingReview(): Promise<number> {
    return 2
  }

  async countBySector(): Promise<SectorTally[]> {
    return [{ sector: 'Kimironko', opportunities: 4 }]
  }

  async listEvents(filter: ReportFilter): Promise<ActivityRow[]> {
    this.filters.push(filter)

    return this.events
  }

  async listCheckins(filter: ReportFilter): Promise<AttendanceRow[]> {
    this.filters.push(filter)

    return this.checkins
  }
}

describe('the oversight summary', () => {
  it('counts the period and the same length of time before it', async () => {
    const reports = new FakeReports()
    const summary = await new AdminService(reports).summary(30)

    expect(summary.days).toBe(30)
    expect(summary.comparable).toBe(true)
    expect(reports.windows).toHaveLength(2)

    const [current, previous] = reports.windows
    const lengthOf = (window: Window) => Math.round((window.to.getTime() - window.from.getTime()) / DAY)

    expect(lengthOf(current!)).toBe(30)
    expect(lengthOf(previous!)).toBe(30)
    // The two periods meet, so nothing is counted twice and nothing is missed.
    expect(previous!.to.getTime()).toBe(current!.from.getTime())
  })

  it('defaults to thirty days when nothing is asked for', async () => {
    const summary = await new AdminService(new FakeReports()).summary(null)

    expect(summary.days).toBe(30)
  })

  it('has nothing to compare against over all time', async () => {
    const reports = new FakeReports()
    const summary = await new AdminService(reports).summary(0)

    expect(summary.comparable).toBe(false)
    expect(summary.previous.checkedIn).toBe(0)
    expect(reports.windows).toHaveLength(1)
  })

  it('reports what is waiting for a decision whatever the period', async () => {
    const summary = await new AdminService(new FakeReports()).summary(90)

    expect(summary.awaitingReview).toBe(2)
    expect(summary.sectors).toEqual([{ sector: 'Kimironko', opportunities: 4 }])
  })
})

describe('the district report', () => {
  it('writes one row per event, with the people counted', async () => {
    const reports = new FakeReports([eventOf()])
    const csv = await new AdminService(reports).report('events', { mode: 'PHYSICAL' })
    const [header, row] = csv.split('\n')

    expect(header).toContain('Turned up')
    expect(row).toContain('Restore the wetland path')
    expect(row).toContain('In person')
    expect(row).toContain('Kimironko')
    expect(row?.endsWith('12,9,7,0')).toBe(true)
    expect(reports.filters[0]?.mode).toBe('PHYSICAL')
  })

  it('writes one row per person when the detail is asked for', async () => {
    const reports = new FakeReports(
      [],
      [
        {
          checkedInAt: new Date('2026-10-18T06:05:00.000Z'),
          checkedOutAt: new Date('2026-10-18T09:05:00.000Z'),
          method: 'QR',
          volunteerName: 'Amara Mensah',
          opportunityTitle: 'Restore the wetland path',
          mode: 'PHYSICAL',
          sector: 'Kimironko',
        },
      ],
    )
    const csv = await new AdminService(reports).report('checkins', {})
    const [header, row] = csv.split('\n')

    expect(header).toContain('Volunteer')
    expect(row).toContain('Amara Mensah')
    expect(row).toContain('3.00')
    expect(row).toContain('Scanned')
  })

  it('passes the sector and the dates straight through', async () => {
    const reports = new FakeReports([])
    const from = new Date('2026-10-01T00:00:00.000Z')
    const to = new Date('2026-10-31T23:59:59.999Z')

    await new AdminService(reports).report('events', { from, to, sector: 'Kimironko' })

    expect(reports.filters[0]).toEqual({ from, to, mode: null, sector: 'Kimironko' })
  })

  it('quotes a title that contains a comma', async () => {
    const reports = new FakeReports([eventOf({ title: 'Clean up, then plant' })])
    const csv = await new AdminService(reports).report('events', {})

    expect(csv).toContain('"Clean up, then plant"')
  })
})
