import { describe, expect, it } from 'vitest'
import { AdminService } from './AdminService'
import type {
  ActivityRow,
  AdminStore,
  AttendanceRow,
  AttendanceTally,
  InitiativeTally,
  RoleTally,
  SectorTally,
} from './AdminStore'

const noPeople: RoleTally = { volunteers: 0, organisations: 0 }

const noInitiatives: InitiativeTally = {
  published: 0,
  citizenProposed: 0,
  citizenApproved: 0,
  citizenRejected: 0,
  awaitingReview: 0,
}

const noAttendance: AttendanceTally = {
  acceptedPlaces: 0,
  checkedIn: 0,
  scanned: 0,
  byHand: 0,
  hoursCredited: 0,
}

class FakeAdminStore implements AdminStore {
  constructor(
    private readonly people: RoleTally = noPeople,
    private readonly initiatives: InitiativeTally = noInitiatives,
    private readonly attendance: AttendanceTally = noAttendance,
    private readonly sectors: SectorTally[] = [],
    private readonly activity: ActivityRow[] = [],
    private readonly register: AttendanceRow[] = [],
  ) {}

  async countRoles() {
    return this.people
  }

  async countInitiatives() {
    return this.initiatives
  }

  async countAttendance() {
    return this.attendance
  }

  async countBySector() {
    return this.sectors
  }

  async listActivity() {
    return this.activity
  }

  async listAttendance() {
    return this.register
  }
}

describe('the oversight summary', () => {
  it('works out the share of citizen initiatives approved', async () => {
    const service = new AdminService(
      new FakeAdminStore(noPeople, {
        ...noInitiatives,
        citizenProposed: 10,
        citizenApproved: 6,
        citizenRejected: 2,
        awaitingReview: 2,
      }),
    )

    const summary = await service.summary()

    expect(summary.initiatives.approvalRate).toBe(75)
  })

  it('works out turnout against accepted places', async () => {
    const service = new AdminService(
      new FakeAdminStore(noPeople, noInitiatives, {
        ...noAttendance,
        acceptedPlaces: 20,
        checkedIn: 13,
      }),
    )

    const summary = await service.summary()

    expect(summary.attendance.turnoutRate).toBe(65)
  })

  it('reports zero rather than dividing by nothing', async () => {
    const summary = await new AdminService(new FakeAdminStore()).summary()

    expect(summary.initiatives.approvalRate).toBe(0)
    expect(summary.attendance.turnoutRate).toBe(0)
  })
})

describe('the attendance export', () => {
  const row: AttendanceRow = {
    checkedInAt: new Date('2026-11-14T08:05:00.000Z'),
    checkedOutAt: new Date('2026-11-14T11:35:00.000Z'),
    method: 'QR',
    volunteerName: 'Amara Mensah',
    opportunityTitle: 'Restore the wetland path',
    sector: 'Kimironko',
  }

  it('writes a header and one line per check in', async () => {
    const service = new AdminService(new FakeAdminStore(noPeople, noInitiatives, noAttendance, [], [], [row]))
    const lines = (await service.attendanceCsv(null, null)).split('\n')

    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('Volunteer')
    expect(lines[1]).toContain('Amara Mensah')
  })

  it('counts the hours between the two times', async () => {
    const service = new AdminService(new FakeAdminStore(noPeople, noInitiatives, noAttendance, [], [], [row]))
    const csv = await service.attendanceCsv(null, null)

    expect(csv).toContain('3.50')
  })

  it('says how the person was marked present', async () => {
    const byHand = { ...row, method: 'MANUAL' }
    const service = new AdminService(new FakeAdminStore(noPeople, noInitiatives, noAttendance, [], [], [byHand]))

    expect(await service.attendanceCsv(null, null)).toContain('By hand')
  })

  it('quotes a title that holds a comma', async () => {
    const awkward = { ...row, opportunityTitle: 'Clean up, then plant' }
    const service = new AdminService(new FakeAdminStore(noPeople, noInitiatives, noAttendance, [], [], [awkward]))

    expect(await service.attendanceCsv(null, null)).toContain('"Clean up, then plant"')
  })

  it('leaves the hours blank when nobody checked out', async () => {
    const open = { ...row, checkedOutAt: null }
    const service = new AdminService(new FakeAdminStore(noPeople, noInitiatives, noAttendance, [], [], [open]))
    const lines = (await service.attendanceCsv(null, null)).split('\n')

    expect(lines[1].endsWith(',,Scanned')).toBe(true)
  })
})
