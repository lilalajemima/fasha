import type { PrismaClient } from '@prisma/client'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { connect, emptyDatabase, makeUser } from '../../test/database'
import { AccountRepository } from './AccountRepository'

const db: PrismaClient = connect()
const accounts = new AccountRepository(db)
const nobodyInParticular = { search: null, role: null, status: null }

beforeEach(async () => {
  await emptyDatabase(db)
})

afterAll(async () => {
  await db.$disconnect()
})

describe('the admin user table', () => {
  it('finds somebody by part of their name or email, whatever the case', async () => {
    const amara = await makeUser(db, { name: 'Amara Mensah', email: 'amara@example.invalid' })
    const keza = await makeUser(db, { name: 'Keza Uwase', email: 'k.uwase@MENSAH-family.invalid' })

    await makeUser(db, { name: 'Gatete Bosco', email: 'gatete@example.invalid' })

    const found = await accounts.list({ ...nobodyInParticular, search: 'mensah' })

    expect(found.map(row => row.id).sort()).toEqual([amara.id, keza.id].sort())
  })

  it('narrows by role and by status', async () => {
    const organiser = await makeUser(db, { role: 'ORGANISATION' })
    const away = await makeUser(db, { status: 'DEACTIVATED' })

    await makeUser(db)

    expect((await accounts.list({ ...nobodyInParticular, role: 'ORGANISATION' })).map(row => row.id)).toEqual([organiser.id])
    expect((await accounts.list({ ...nobodyInParticular, status: 'DEACTIVATED' })).map(row => row.id)).toEqual([away.id])
  })

  it('puts active accounts first', async () => {
    await makeUser(db, { status: 'DEACTIVATED' })
    await makeUser(db)

    const statuses = (await accounts.list(nobodyInParticular)).map(row => row.status)

    expect(statuses).toEqual(['ACTIVE', 'DEACTIVATED'])
  })

  it('never reads out the password hash', async () => {
    await makeUser(db, { passwordHash: 'a-secret-hash' })

    const [row] = await accounts.list(nobodyInParticular)

    expect(JSON.stringify(row)).not.toContain('a-secret-hash')
  })

  it('counts only active admins', async () => {
    await makeUser(db, { role: 'ADMIN' })
    await makeUser(db, { role: 'ADMIN', status: 'DEACTIVATED' })
    await makeUser(db, { role: 'ORGANISATION' })

    expect(await accounts.countActiveAdmins()).toBe(1)
  })

  it('moves the token version on with every password change', async () => {
    const amara = await makeUser(db)

    expect(await accounts.setPassword(amara.id, 'new-hash', false)).toBe(1)
    expect(await accounts.setPassword(amara.id, 'newer-hash', true)).toBe(2)
  })
})
