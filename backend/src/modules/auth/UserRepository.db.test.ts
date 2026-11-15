import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { connect, emptyDatabase, makeUser } from '../../test/database'
import { UserRepository } from './UserRepository'

const db: PrismaClient = connect()
const users = new UserRepository(db)

beforeEach(async () => {
  await emptyDatabase(db)
})

afterAll(async () => {
  await db.$disconnect()
})

describe('accounts and Google', () => {
  it('stores an account with no password, for somebody who joined with Google', async () => {
    const created = await users.createVolunteer(
      { name: 'Amara Mensah', email: 'amara@example.invalid', passwordHash: null, googleId: 'google-amara' },
      'amara-mensah-x1',
    )

    const found = await users.findByGoogleId('google-amara')

    expect(found?.id).toBe(created.id)
    expect(found?.passwordHash).toBeNull()
    expect((await users.findWithProfile(created.id))?.profile?.portfolioSlug).toBe('amara-mensah-x1')
  })

  it('links Google to an account that already exists', async () => {
    const amara = await makeUser(db, { email: 'amara@example.invalid' })

    await users.linkGoogle(amara.id, 'google-amara')

    expect((await users.findByGoogleId('google-amara'))?.id).toBe(amara.id)
  })

  it('refuses to link one Google account to two Fasha accounts', async () => {
    await makeUser(db, { googleId: 'google-amara' })
    const someoneElse = await makeUser(db)

    await expect(users.linkGoogle(someoneElse.id, 'google-amara')).rejects.toThrow()
  })

  it('allows any number of accounts with no Google account', async () => {
    await makeUser(db)
    await makeUser(db)

    expect(await db.user.count({ where: { googleId: null } })).toBe(2)
  })

  it('refuses a second account with the same email', async () => {
    await makeUser(db, { email: 'amara@example.invalid' })

    await expect(makeUser(db, { email: 'amara@example.invalid' })).rejects.toThrow()
  })
})
