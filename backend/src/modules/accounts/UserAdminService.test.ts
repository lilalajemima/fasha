import type { User } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import type { Hasher } from '../../core/security/PasswordHasher'
import type { TokenPayload } from '../../core/security/TokenService'
import type { AccountRow, AccountStore, Anonymised, UserFilter } from './AccountStore'
import { UserAdminService } from './UserAdminService'

const admin: TokenPayload = { userId: 'admin-1', role: 'ADMIN' }

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'volunteer-1',
    name: 'Amara Mensah',
    email: 'amara@example.rw',
    passwordHash: 'hash:correct-horse',
    role: 'VOLUNTEER',
    status: 'ACTIVE',
    mustChangePassword: false,
    deactivatedAt: null,
    deletedAt: null,
    createdAt: new Date('2026-10-01T08:00:00.000Z'),
    updatedAt: new Date('2026-10-01T08:00:00.000Z'),
    ...overrides,
  } as User
}

function rowFor(user: User): AccountRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    createdAt: user.createdAt,
    deactivatedAt: user.deactivatedAt,
  }
}

const hasher: Hasher = {
  async hash(plainText: string) {
    return `hash:${plainText}`
  },
  async matches(plainText: string, hash: string) {
    return hash === `hash:${plainText}`
  },
}

class FakeAccountStore implements AccountStore {
  askedFor: UserFilter | null = null
  passwordSetTo: { hash: string; mustChange: boolean } | null = null
  statusSetTo: { status: string; deactivatedAt: Date | null } | null = null
  anonymisedWith: Anonymised | null = null

  constructor(
    private readonly users: User[],
    private readonly activeAdmins = 2,
  ) {}

  async findById(id: string) {
    return this.users.find(user => user.id === id) ?? null
  }

  async findRow(id: string) {
    const user = this.users.find(entry => entry.id === id)

    return user ? rowFor(user) : null
  }

  async list(filter: UserFilter) {
    this.askedFor = filter

    return this.users.map(rowFor)
  }

  async countActiveAdmins() {
    return this.activeAdmins
  }

  async setPassword(_id: string, passwordHash: string, mustChange: boolean) {
    this.passwordSetTo = { hash: passwordHash, mustChange }
  }

  async setStatus(id: string, status: string, deactivatedAt: Date | null) {
    this.statusSetTo = { status, deactivatedAt }

    const user = this.users.find(entry => entry.id === id)

    if (user) {
      Object.assign(user, { status, deactivatedAt })
    }
  }

  async anonymise(_id: string, replacement: Anonymised) {
    this.anonymisedWith = replacement
  }
}

function build(users: User[] = [makeUser()], activeAdmins = 2) {
  const store = new FakeAccountStore(users, activeAdmins)

  return { store, service: new UserAdminService(store, hasher) }
}

describe('the user list', () => {
  it('passes the filters through to the database rather than filtering in memory', async () => {
    const { service, store } = build()

    await service.list({ search: 'amara', role: 'VOLUNTEER', status: 'ACTIVE' })

    expect(store.askedFor).toEqual({ search: 'amara', role: 'VOLUNTEER', status: 'ACTIVE' })
  })

  it('reports each account as the table needs it', async () => {
    const { service } = build()

    const [row] = await service.list({ search: null, role: null, status: null })

    expect(row.email).toBe('amara@example.rw')
    expect(row.status).toBe('ACTIVE')
    expect(typeof row.createdAt).toBe('string')
  })
})

describe('suspending and restoring an account', () => {
  it('deactivates somebody and records when', async () => {
    const { service, store } = build()

    const view = await service.setStatus(admin, 'volunteer-1', 'DEACTIVATED')

    expect(store.statusSetTo?.status).toBe('DEACTIVATED')
    expect(view.status).toBe('DEACTIVATED')
  })

  it('clears the date when the account is restored', async () => {
    const { service, store } = build([
      makeUser({ status: 'DEACTIVATED', deactivatedAt: new Date() }),
    ])

    await service.setStatus(admin, 'volunteer-1', 'ACTIVE')

    expect(store.statusSetTo).toEqual({ status: 'ACTIVE', deactivatedAt: null })
  })

  it('refuses to change your own status from here', async () => {
    const { service } = build([makeUser({ id: 'admin-1', role: 'ADMIN' })])

    await expect(service.setStatus(admin, 'admin-1', 'DEACTIVATED')).rejects.toThrow(
      'cannot change your own status',
    )
  })

  it('refuses to deactivate the last active admin', async () => {
    const { service } = build([makeUser({ id: 'admin-2', role: 'ADMIN' })], 1)

    await expect(service.setStatus(admin, 'admin-2', 'DEACTIVATED')).rejects.toThrow(
      'only active community admin',
    )
  })

  it('will not bring back a deleted account', async () => {
    const { service } = build([makeUser({ status: 'DELETED' })])

    await expect(service.setStatus(admin, 'volunteer-1', 'ACTIVE')).rejects.toThrow(
      'cannot be restored',
    )
  })

  it('says so when nothing would change', async () => {
    const { service } = build()

    await expect(service.setStatus(admin, 'volunteer-1', 'ACTIVE')).rejects.toThrow('already')
  })
})

describe('issuing a temporary password', () => {
  /**
   * Fasha has no email, so recovery is done in person. The admin reads the
   * password out once and the account must change it at the next sign-in, so
   * the admin is not left holding somebody else's credentials.
   */
  it('returns the password once and forces a change', async () => {
    const { service, store } = build()

    const result = await service.issueTemporaryPassword(admin, 'volunteer-1')

    expect(result.temporaryPassword).toMatch(/^fasha-[0-9a-f]{8}$/)
    expect(store.passwordSetTo?.mustChange).toBe(true)
    expect(store.passwordSetTo?.hash).toBe(`hash:${result.temporaryPassword}`)
  })

  it('refuses for an account that no longer exists', async () => {
    const { service } = build([])

    await expect(service.issueTemporaryPassword(admin, 'nobody')).rejects.toThrow(
      'No account with that id',
    )
  })
})

describe('deleting somebody else', () => {
  it('anonymises rather than erasing', async () => {
    const { service, store } = build()

    await service.remove(admin, 'volunteer-1')

    expect(store.anonymisedWith?.name).toBe('Removed account')
    expect(store.anonymisedWith?.email).toBe('deleted-volunteer-1@fasha.invalid')
  })

  it('refuses to delete the last active admin', async () => {
    const { service } = build([makeUser({ id: 'admin-2', role: 'ADMIN' })], 1)

    await expect(service.remove(admin, 'admin-2')).rejects.toThrow('only active community admin')
  })

  it('refuses twice over the same account', async () => {
    const { service } = build([makeUser({ status: 'DELETED' })])

    await expect(service.remove(admin, 'volunteer-1')).rejects.toThrow('already been deleted')
  })
})
