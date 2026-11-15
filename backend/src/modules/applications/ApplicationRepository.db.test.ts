import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { apply, connect, emptyDatabase, makeOpportunity, makeUser } from '../../test/database'
import { ApplicationRepository } from './ApplicationRepository'

const db: PrismaClient = connect()
const applications = new ApplicationRepository(db)

beforeEach(async () => {
  await emptyDatabase(db)
})

afterAll(async () => {
  await db.$disconnect()
})

async function oneFreePlace() {
  const organiser = await makeUser(db, { role: 'ORGANISATION' })
  const event = await makeOpportunity(db, organiser.id, { maxCapacity: 1 })
  const first = await apply(db, event.id, (await makeUser(db)).id)
  const second = await apply(db, event.id, (await makeUser(db)).id)

  return { event, first, second }
}

const acceptedOn = (opportunityId: string) =>
  db.application.count({ where: { opportunityId, status: 'ACCEPTED' } })

describe('giving out places', () => {
  it('accepts while there is room and refuses once it is full', async () => {
    const { event, first, second } = await oneFreePlace()

    expect(await applications.acceptIfSpace(first.id, event.id, 1)).not.toBeNull()
    expect(await applications.acceptIfSpace(second.id, event.id, 1)).toBeNull()
    expect(await acceptedOn(event.id)).toBe(1)
  })

  it('never gives the last place twice when two organisers press accept at once', async () => {
    const { event, first, second } = await oneFreePlace()

    // One of these may be refused and the other may fail outright as a clash.
    // Either way, only one person may end up with the place.
    await Promise.allSettled([
      applications.acceptIfSpace(first.id, event.id, 1),
      applications.acceptIfSpace(second.id, event.id, 1),
    ])

    expect(await acceptedOn(event.id)).toBe(1)
  })

  it('lets one person apply to an opportunity only once', async () => {
    const organiser = await makeUser(db, { role: 'ORGANISATION' })
    const event = await makeOpportunity(db, organiser.id)
    const amara = await makeUser(db)

    await apply(db, event.id, amara.id)

    await expect(apply(db, event.id, amara.id)).rejects.toThrow()
  })
})
