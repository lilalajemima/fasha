import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { apply, connect, emptyDatabase, makeOpportunity, makeUser } from '../../test/database'
import { AdminRepository } from './AdminRepository'

const db: PrismaClient = connect()
const reports = new AdminRepository(db)

const ALL_TIME = { from: new Date(0), to: new Date('2100-01-01'), mode: null, sector: null }
const OCTOBER = { from: new Date('2026-10-01T00:00:00Z'), to: new Date('2026-10-31T23:59:59Z') }

beforeEach(async () => {
  await emptyDatabase(db)
})

afterAll(async () => {
  await db.$disconnect()
})

async function october() {
  const organiser = await makeUser(db, { name: 'Green Neighbourhood', role: 'ORGANISATION' })
  const wetland = await makeOpportunity(db, organiser.id, {
    title: 'Restore the wetland path',
    sector: 'Kimironko',
    startsAt: new Date('2026-10-10T08:00:00Z'),
  })
  const poster = await makeOpportunity(db, organiser.id, {
    title: 'Design the clean-up poster',
    mode: 'VIRTUAL',
    sector: 'Gisozi',
    startsAt: null,
    endsAt: new Date('2026-10-20T17:00:00Z'),
  })
  const december = await makeOpportunity(db, organiser.id, {
    title: 'Plant the school garden',
    sector: 'Kimironko',
    startsAt: new Date('2026-12-01T08:00:00Z'),
  })

  return { organiser, wetland, poster, december }
}

describe('the events in a report', () => {
  it('keeps to the period, by when each happened, latest first', async () => {
    const { wetland, poster } = await october()

    const rows = await reports.listEvents({ ...OCTOBER, mode: null, sector: null })

    expect(rows.map(row => row.id)).toEqual([poster.id, wetland.id])
  })

  it('dates a virtual task by when it is due', async () => {
    const { poster } = await october()

    const [row] = await reports.listEvents({ ...ALL_TIME, opportunityId: poster.id })

    expect(row.happenedAt.toISOString()).toBe('2026-10-20T17:00:00.000Z')
  })

  it('narrows by sector and by kind', async () => {
    const { wetland, poster } = await october()

    const kimironko = await reports.listEvents({ ...OCTOBER, mode: null, sector: 'Kimironko' })
    const virtual = await reports.listEvents({ ...OCTOBER, mode: 'VIRTUAL', sector: null })

    expect(kimironko.map(row => row.id)).toEqual([wetland.id])
    expect(virtual.map(row => row.id)).toEqual([poster.id])
  })

  it('gives one event on its own when asked', async () => {
    const { december } = await october()

    const rows = await reports.listEvents({ ...ALL_TIME, opportunityId: december.id })

    expect(rows.map(row => row.title)).toEqual(['Plant the school garden'])
  })

  it('counts who applied, who got a place, who came and whose work was accepted', async () => {
    const { wetland, poster } = await october()
    const [amara, keza, mugisha] = await Promise.all([makeUser(db), makeUser(db), makeUser(db)])

    await apply(db, wetland.id, amara.id, 'ACCEPTED')
    await apply(db, wetland.id, keza.id, 'ACCEPTED')
    await apply(db, wetland.id, mugisha.id, 'PENDING')
    await db.checkin.create({ data: { opportunityId: wetland.id, volunteerId: amara.id } })
    await db.taskSubmission.create({ data: { opportunityId: poster.id, volunteerId: keza.id, hoursClaimed: 3, proofUrl: 'https://example.invalid/a', status: 'APPROVED' } })
    await db.taskSubmission.create({ data: { opportunityId: poster.id, volunteerId: mugisha.id, hoursClaimed: 2, proofUrl: 'https://example.invalid/b', status: 'PENDING' } })

    const rows = await reports.listEvents({ ...OCTOBER, mode: null, sector: null })
    const byId = new Map(rows.map(row => [row.id, row]))

    expect(byId.get(wetland.id)).toMatchObject({ applications: 3, accepted: 2, checkedIn: 1, delivered: 0, organiser: 'Green Neighbourhood' })
    expect(byId.get(poster.id)).toMatchObject({ applications: 0, delivered: 1 })
  })
})

describe('the attendance in a report', () => {
  it('lists check-ins in the period, in order, for one event when asked', async () => {
    const { wetland, december } = await october()
    const amara = await makeUser(db, { name: 'Amara Mensah' })
    const keza = await makeUser(db, { name: 'Keza Uwase' })

    await db.checkin.create({ data: { opportunityId: wetland.id, volunteerId: keza.id, checkinTime: new Date('2026-10-10T09:00:00Z') } })
    await db.checkin.create({ data: { opportunityId: wetland.id, volunteerId: amara.id, checkinTime: new Date('2026-10-10T08:05:00Z'), method: 'MANUAL' } })
    await db.checkin.create({ data: { opportunityId: december.id, volunteerId: amara.id, checkinTime: new Date('2026-12-01T08:00:00Z') } })

    const inOctober = await reports.listCheckins({ ...OCTOBER, mode: null, sector: null })
    const oneEvent = await reports.listCheckins({ ...ALL_TIME, opportunityId: december.id })

    expect(inOctober.map(row => row.volunteerName)).toEqual(['Amara Mensah', 'Keza Uwase'])
    expect(inOctober[0]).toMatchObject({ method: 'MANUAL', opportunityTitle: 'Restore the wetland path', sector: 'Kimironko' })
    expect(oneEvent.map(row => row.opportunityTitle)).toEqual(['Plant the school garden'])
  })
})

describe('the numbers for a period', () => {
  it('counts only what was posted inside it, and what residents proposed', async () => {
    const organiser = await makeUser(db, { role: 'ORGANISATION' })
    const resident = await makeUser(db)
    const inside = new Date('2026-10-05T10:00:00Z')

    await makeOpportunity(db, organiser.id, { createdAt: inside })
    await makeOpportunity(db, resident.id, { createdAt: inside, status: 'PENDING_APPROVAL' })
    await makeOpportunity(db, organiser.id, { createdAt: new Date('2026-09-05T10:00:00Z') })

    const tally = await reports.tally(OCTOBER)

    expect(tally).toMatchObject({ opportunitiesPosted: 2, citizenProposed: 1, published: 1 })
  })

  it('adds up the hours credited in the period, to two decimal places', async () => {
    const organiser = await makeUser(db, { role: 'ORGANISATION' })
    const amara = await makeUser(db)
    const event = await makeOpportunity(db, organiser.id)

    await db.portfolioEntry.create({ data: { volunteerId: amara.id, opportunityId: event.id, hoursCredited: 2.333, dateCredited: new Date('2026-10-10T12:00:00Z') } })
    await db.portfolioEntry.create({ data: { volunteerId: amara.id, opportunityId: event.id, hoursCredited: 1.5, dateCredited: new Date('2026-10-11T12:00:00Z') } })
    await db.portfolioEntry.create({ data: { volunteerId: amara.id, opportunityId: event.id, hoursCredited: 8, dateCredited: new Date('2026-11-02T12:00:00Z') } })

    expect((await reports.tally(OCTOBER)).hoursCredited).toBe(3.83)
  })

  it('counts what is waiting for review whenever it was posted', async () => {
    const resident = await makeUser(db)

    await makeOpportunity(db, resident.id, { status: 'PENDING_APPROVAL', createdAt: new Date('2025-01-01T00:00:00Z') })
    await makeOpportunity(db, resident.id, { status: 'PENDING_APPROVAL' })
    await makeOpportunity(db, resident.id, { status: 'REJECTED' })

    expect(await reports.countAwaitingReview()).toBe(2)
  })
})
