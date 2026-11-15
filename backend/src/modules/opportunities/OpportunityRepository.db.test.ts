import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { connect, emptyDatabase, makeOpportunity, makeUser } from '../../test/database'
import { OpportunityRepository } from './OpportunityRepository'

const db: PrismaClient = connect()
const opportunities = new OpportunityRepository(db)
const everything = { search: null, mode: null, sector: null }

beforeEach(async () => {
  await emptyDatabase(db)
})

afterAll(async () => {
  await db.$disconnect()
})

describe('the Discover feed', () => {
  it('only shows published work that is still taking applications', async () => {
    const organiser = await makeUser(db, { role: 'ORGANISATION' })
    const open = await makeOpportunity(db, organiser.id, { title: 'Open' })

    await makeOpportunity(db, organiser.id, { title: 'Waiting', status: 'PENDING_APPROVAL' })
    await makeOpportunity(db, organiser.id, { title: 'Turned down', status: 'REJECTED' })
    await makeOpportunity(db, organiser.id, { title: 'Closed', applicationDeadline: new Date(Date.now() - 60_000) })

    const feed = await opportunities.findPublished(everything)

    expect(feed.map(item => item.id)).toEqual([open.id])
  })

  it('puts the soonest deadline first', async () => {
    const organiser = await makeUser(db, { role: 'ORGANISATION' })
    const later = await makeOpportunity(db, organiser.id, { applicationDeadline: new Date(Date.now() + 9 * 86_400_000) })
    const sooner = await makeOpportunity(db, organiser.id, { applicationDeadline: new Date(Date.now() + 2 * 86_400_000) })

    const feed = await opportunities.findPublished(everything)

    expect(feed.map(item => item.id)).toEqual([sooner.id, later.id])
  })

  it('searches the title and the description, whatever the case', async () => {
    const organiser = await makeUser(db, { role: 'ORGANISATION' })
    const byTitle = await makeOpportunity(db, organiser.id, { title: 'River clean up' })
    const byDescription = await makeOpportunity(db, organiser.id, { title: 'Saturday work', description: 'Clearing the banks of the river.' })

    await makeOpportunity(db, organiser.id, { title: 'Reading club', description: 'Books with children.' })

    const feed = await opportunities.findPublished({ ...everything, search: 'RIVER' })

    expect(feed.map(item => item.id).sort()).toEqual([byTitle.id, byDescription.id].sort())
  })

  it('narrows by kind and by sector', async () => {
    const organiser = await makeUser(db, { role: 'ORGANISATION' })
    const gisozi = await makeOpportunity(db, organiser.id, { sector: 'Gisozi' })
    const online = await makeOpportunity(db, organiser.id, { mode: 'VIRTUAL', sector: 'Kimironko' })

    expect((await opportunities.findPublished({ ...everything, sector: 'Gisozi' })).map(item => item.id)).toEqual([gisozi.id])
    expect((await opportunities.findPublished({ ...everything, mode: 'VIRTUAL' })).map(item => item.id)).toEqual([online.id])
  })

  it('names who posted each one', async () => {
    const organiser = await makeUser(db, { name: 'Green Neighbourhood', role: 'ORGANISATION' })

    await makeOpportunity(db, organiser.id)

    const [item] = await opportunities.findPublished(everything)

    expect(item.creator).toEqual({ id: organiser.id, name: 'Green Neighbourhood', role: 'ORGANISATION' })
  })
})
