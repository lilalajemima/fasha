import { describe, expect, it } from 'vitest'
import { ConflictError, ForbiddenError, UnauthorisedError } from '../../core/errors/HttpErrors'
import { TotpService } from '../../core/security/TotpService'
import type { Clock } from '../../core/time/Clock'
import type { ApplicationRecord, ApplicationStore } from '../applications/ApplicationStore'
import type { OpportunityRecord, OpportunityStore } from '../opportunities/OpportunityStore'
import { CheckinService } from './CheckinService'
import type { CheckinRecord, CheckinStore } from './CheckinStore'

const totp = new TotpService()
const secret = totp.createSecret()
const arrival = new Date('2026-11-14T08:00:00.000Z')

const volunteer = { userId: 'volunteer-1', role: 'VOLUNTEER' }
const stranger = { userId: 'volunteer-2', role: 'VOLUNTEER' }
const organiser = { userId: 'organisation-1', role: 'ORGANISATION' }

class StoppedClock implements Clock {
  constructor(private current: Date) {}

  now() {
    return this.current
  }

  moveOn(hours: number) {
    this.current = new Date(this.current.getTime() + hours * 3600000)
  }
}

function makeOpportunity(overrides: Partial<OpportunityRecord> = {}): OpportunityRecord {
  return {
    id: 'opportunity-1',
    creatorId: 'organisation-1',
    title: 'Restore the wetland path',
    description: 'Plant trees and clear the path with the neighbourhood team.',
    mode: 'PHYSICAL',
    location: 'Kimironko',
    sector: 'Kimironko',
    maxCapacity: 20,
    applicationDeadline: new Date('2026-11-13T00:00:00.000Z'),
    startsAt: new Date('2026-11-14T08:00:00.000Z'),
    endsAt: new Date('2026-11-14T12:00:00.000Z'),
    status: 'PUBLISHED',
    qrToken: secret,
    requiredSkills: ['Teamwork'],
    categories: ['Environment'],
    createdAt: arrival,
    updatedAt: arrival,
    creator: { id: 'organisation-1', name: 'Green Neighbourhood', role: 'ORGANISATION' },
    ...overrides,
  }
}

function makeCheckin(overrides: Partial<CheckinRecord> = {}): CheckinRecord {
  return {
    id: 'checkin-1',
    opportunityId: 'opportunity-1',
    volunteerId: 'volunteer-1',
    checkinTime: arrival,
    checkoutTime: null,
    method: 'QR',
    volunteer: { id: 'volunteer-1', name: 'Amara Mensah' },
    opportunity: {
      id: 'opportunity-1',
      title: 'Restore the wetland path',
      creatorId: 'organisation-1',
      requiredSkills: ['Teamwork'],
      qrToken: secret,
    },
    ...overrides,
  }
}

class FakeOpportunityStore implements OpportunityStore {
  saved: string | null = null

  constructor(private readonly opportunity: OpportunityRecord | null) {}

  async create(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async findPublished() {
    return []
  }

  async findById() {
    return this.opportunity
  }

  async findCreatedBy() {
    return []
  }

  async findAwaitingApproval() {
    return []
  }

  async updateStatus(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async setQrToken(_id: string, qrToken: string) {
    this.saved = qrToken
  }
}

class FakeApplicationStore implements ApplicationStore {
  constructor(private readonly acceptedVolunteers: string[] = ['volunteer-1']) {}

  async create(): Promise<never> {
    throw new Error('not needed in this test')
  }

  async findById() {
    return null
  }

  async findByVolunteer() {
    return []
  }

  async findForOpportunity() {
    return []
  }

  async findAccepted(_opportunityId: string, volunteerId: string) {
    return this.acceptedVolunteers.includes(volunteerId)
      ? ({ id: 'application-1', status: 'ACCEPTED' } as unknown as ApplicationRecord)
      : null
  }

  async acceptIfSpace() {
    return null
  }

  async updateStatus(): Promise<never> {
    throw new Error('not needed in this test')
  }
}

class FakeCheckinStore implements CheckinStore {
  credited: { hours: number; skills: string[] } | null = null

  constructor(private readonly records: CheckinRecord[] = []) {}

  async create(opportunityId: string, volunteerId: string, method: string) {
    const record = makeCheckin({
      opportunityId,
      volunteerId,
      method: method as CheckinRecord['method'],
    })
    this.records.push(record)
    return record
  }

  async findById(id: string) {
    return this.records.find(record => record.id === id) ?? null
  }

  async findForOpportunity(opportunityId: string) {
    return this.records.filter(record => record.opportunityId === opportunityId)
  }

  async findOne(opportunityId: string, volunteerId: string) {
    return (
      this.records.find(
        record => record.opportunityId === opportunityId && record.volunteerId === volunteerId,
      ) ?? null
    )
  }

  async checkOutAndCredit(id: string, leftAt: Date, hours: number, skills: string[]) {
    this.credited = { hours, skills }
    const record = this.records.find(entry => entry.id === id)!
    record.checkoutTime = leftAt
    return record
  }
}

function build({
  opportunity = makeOpportunity(),
  checkins = [] as CheckinRecord[],
  accepted = ['volunteer-1'],
  clock = new StoppedClock(arrival),
} = {}) {
  const checkinStore = new FakeCheckinStore(checkins)
  const opportunityStore = new FakeOpportunityStore(opportunity)
  const service = new CheckinService(
    checkinStore,
    opportunityStore,
    new FakeApplicationStore(accepted),
    totp,
    clock,
    'https://fasha.test',
  )

  return { service, checkinStore, opportunityStore, clock }
}

describe('opening check in', () => {
  it('gives the organiser a code and a countdown', async () => {
    const { service } = build()
    const opened = await service.openCheckIn(organiser, 'opportunity-1')

    expect(opened.code).toMatch(/^\d{6}$/)
    expect(opened.secondsRemaining).toBeGreaterThan(0)
    expect(opened.payload).toBe(
      `https://fasha.test/check-in?o=opportunity-1&c=${opened.code}`,
    )
  })

  it('creates and stores a secret the first time', async () => {
    const { service, opportunityStore } = build({ opportunity: makeOpportunity({ qrToken: null }) })

    await service.openCheckIn(organiser, 'opportunity-1')

    expect(opportunityStore.saved).toHaveLength(40)
  })

  it('refuses a volunteer', async () => {
    const { service } = build()

    await expect(service.openCheckIn(volunteer, 'opportunity-1')).rejects.toThrow(ForbiddenError)
  })
})

describe('checking in', () => {
  it('accepts the current code', async () => {
    const { service } = build()
    const view = await service.checkIn(volunteer, 'opportunity-1', totp.generate(secret, arrival))

    expect(view.method).toBe('QR')
    expect(view.checkedOutAt).toBeNull()
  })

  it('refuses a stale code', async () => {
    const { service } = build()
    const old = totp.generate(secret, new Date(arrival.getTime() - 120000))

    await expect(service.checkIn(volunteer, 'opportunity-1', old)).rejects.toThrow(UnauthorisedError)
  })

  it('refuses a volunteer who was never accepted', async () => {
    const { service } = build({ accepted: [] })
    const code = totp.generate(secret, arrival)

    await expect(service.checkIn(volunteer, 'opportunity-1', code)).rejects.toThrow(ForbiddenError)
  })

  it('refuses an organisation account', async () => {
    const { service } = build()
    const code = totp.generate(secret, arrival)

    await expect(service.checkIn(organiser, 'opportunity-1', code)).rejects.toThrow(ForbiddenError)
  })

  it('refuses a second check in', async () => {
    const { service } = build({ checkins: [makeCheckin()] })
    const code = totp.generate(secret, arrival)

    await expect(service.checkIn(volunteer, 'opportunity-1', code)).rejects.toThrow(ConflictError)
  })

  it('refuses before the organiser has opened check in', async () => {
    const { service } = build({ opportunity: makeOpportunity({ qrToken: null }) })

    await expect(service.checkIn(volunteer, 'opportunity-1', '123456')).rejects.toThrow(
      'The organiser has not opened check in yet',
    )
  })
})

describe('marking someone present by hand', () => {
  it('lets the organiser do it when a phone fails', async () => {
    const { service } = build()
    const view = await service.markPresent(organiser, 'opportunity-1', 'volunteer-1')

    expect(view.method).toBe('MANUAL')
  })

  it('stops a volunteer doing it', async () => {
    const { service } = build()

    await expect(service.markPresent(volunteer, 'opportunity-1', 'volunteer-1')).rejects.toThrow(
      ForbiddenError,
    )
  })
})

describe('checking out', () => {
  it('counts the hours and credits the portfolio', async () => {
    const clock = new StoppedClock(arrival)
    const { service, checkinStore } = build({ checkins: [makeCheckin()], clock })

    clock.moveOn(2.5)
    const view = await service.checkOut(
      volunteer,
      'checkin-1',
      totp.generate(secret, clock.now()),
    )

    expect(view.hours).toBe(2.5)
    expect(checkinStore.credited).toEqual({ hours: 2.5, skills: ['Teamwork'] })
  })

  it('lets the organiser close someone off', async () => {
    const clock = new StoppedClock(arrival)
    const { service } = build({ checkins: [makeCheckin()], clock })

    clock.moveOn(1)

    expect((await service.checkOut(organiser, 'checkin-1')).hours).toBe(1)
  })

  it('stops anyone else closing it', async () => {
    const { service } = build({ checkins: [makeCheckin()] })

    await expect(service.checkOut(stranger, 'checkin-1')).rejects.toThrow(ForbiddenError)
  })

  it('makes the volunteer scan again rather than leaving from home', async () => {
    const { service } = build({ checkins: [makeCheckin()] })

    await expect(service.checkOut(volunteer, 'checkin-1')).rejects.toThrow(
      'Enter the code the organiser is showing',
    )
  })

  it('refuses a stale code on the way out', async () => {
    const clock = new StoppedClock(arrival)
    const { service } = build({ checkins: [makeCheckin()], clock })
    const old = totp.generate(secret, new Date(arrival.getTime() - 120000))

    clock.moveOn(1)

    await expect(service.checkOut(volunteer, 'checkin-1', old)).rejects.toThrow(UnauthorisedError)
  })

  it('refuses a second check out', async () => {
    const { service } = build({ checkins: [makeCheckin({ checkoutTime: arrival })] })

    await expect(service.checkOut(volunteer, 'checkin-1')).rejects.toThrow(ConflictError)
  })

  it('reports a check in that does not exist', async () => {
    const { service } = build()

    await expect(service.checkOut(volunteer, 'nope')).rejects.toThrow('does not exist')
  })
})

describe('the attendance list', () => {
  it('shows the organiser who turned up', async () => {
    const { service } = build({ checkins: [makeCheckin()] })
    const list = await service.attendance(organiser, 'opportunity-1')

    expect(list).toHaveLength(1)
    expect(list[0].volunteer.name).toBe('Amara Mensah')
  })

  it('hides it from a volunteer', async () => {
    const { service } = build({ checkins: [makeCheckin()] })

    await expect(service.attendance(volunteer, 'opportunity-1')).rejects.toThrow(ForbiddenError)
  })
})
