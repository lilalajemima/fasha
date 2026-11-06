import type { User } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import type { Hasher } from '../../core/security/PasswordHasher'
import type { TokenPayload } from '../../core/security/TokenService'
import type { Notifier } from '../notifications/Notifier'
import { AccountService } from './AccountService'
import type { AccountRow, AccountStore, Anonymised, UserFilter } from './AccountStore'

const volunteer: TokenPayload = { userId: 'volunteer-1', role: 'VOLUNTEER' }
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

/** Hashing is `hash:` plus the text, which is enough to assert against and costs nothing. */
const hasher: Hasher = {
  async hash(plainText: string) {
    return `hash:${plainText}`
  },
  async matches(plainText: string, hash: string) {
    return hash === `hash:${plainText}`
  },
}

class FakeAccountStore implements AccountStore {
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

  async findRow(): Promise<AccountRow | null> {
    return null
  }

  async list(filter: UserFilter): Promise<AccountRow[]> {
    return this.users
      .filter(user => !filter.role || user.role === filter.role)
      .filter(user => !filter.status || user.status === filter.status)
      .map(toRow)
  }

  async countActiveAdmins() {
    return this.activeAdmins
  }

  async findByEmail(email: string) {
    const user = this.users.find(entry => entry.email === email)

    return user ? toRow(user) : null
  }

  async setPassword(_id: string, passwordHash: string, mustChange: boolean) {
    this.passwordSetTo = { hash: passwordHash, mustChange }
  }

  async setStatus(_id: string, status: string, deactivatedAt: Date | null) {
    this.statusSetTo = { status, deactivatedAt }
  }

  async anonymise(_id: string, replacement: Anonymised) {
    this.anonymisedWith = replacement
  }
}

class RecordingNotifier implements Notifier {
  sent: { userId: string; message: string }[] = []

  async send(userId: string, _type: string, message: string) {
    this.sent.push({ userId, message })
  }
}

function toRow(user: User): AccountRow {
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

function build(users: User[] = [makeUser()], activeAdmins = 2) {
  const store = new FakeAccountStore(users, activeAdmins)
  const notifier = new RecordingNotifier()

  return { store, notifier, service: new AccountService(store, hasher, notifier) }
}

describe('a forgotten password', () => {
  it('tells the admins who is locked out', async () => {
    const locked = makeUser({ id: 'volunteer-7', email: 'amara@example.com', name: 'Amara Mensah' })
    const admin = makeUser({ id: 'admin-1', email: 'admin@fasha.demo', role: 'ADMIN' })
    const { service, notifier } = build([locked, admin])

    await service.forgotten('amara@example.com')

    expect(notifier.sent).toHaveLength(1)
    expect(notifier.sent[0].userId).toBe('admin-1')
    expect(notifier.sent[0].message).toContain('amara@example.com')
  })

  /** An address that is not here must look exactly like one that is. */
  it('says nothing about an address nobody owns', async () => {
    const { service, notifier } = build()

    await expect(service.forgotten('stranger@example.com')).resolves.toBeUndefined()
    expect(notifier.sent).toEqual([])
  })
})

describe('changing your own password', () => {
  it('refuses when the current password is wrong', async () => {
    const { service } = build()

    await expect(
      service.changePassword(volunteer, 'not-my-password', 'a-brand-new-password'),
    ).rejects.toThrow('current password is not correct')
  })

  it('refuses a new password that is the same as the old one', async () => {
    const { service } = build()

    await expect(
      service.changePassword(volunteer, 'correct-horse', 'correct-horse'),
    ).rejects.toThrow('has to be different')
  })

  it('stores the new password and clears the forced change', async () => {
    const { service, store } = build([makeUser({ mustChangePassword: true })])

    await service.changePassword(volunteer, 'correct-horse', 'a-brand-new-password')

    expect(store.passwordSetTo).toEqual({ hash: 'hash:a-brand-new-password', mustChange: false })
  })
})

describe('deactivating your own account', () => {
  it('asks for the password first', async () => {
    const { service } = build()

    await expect(service.deactivate(volunteer, 'wrong')).rejects.toThrow('not correct')
  })

  it('records when it happened', async () => {
    const { service, store } = build()

    await service.deactivate(volunteer, 'correct-horse')

    expect(store.statusSetTo?.status).toBe('DEACTIVATED')
    expect(store.statusSetTo?.deactivatedAt).toBeInstanceOf(Date)
  })

  it('refuses to leave the platform without an admin', async () => {
    const { service } = build([makeUser({ id: 'admin-1', role: 'ADMIN' })], 1)

    await expect(service.deactivate(admin, 'correct-horse')).rejects.toThrow('only active')
  })
})

describe('deleting your own account', () => {
  /**
   * The row stays so that other people's registers and credited hours keep
   * their shape. What has to go is everything that identifies the person.
   */
  it('replaces the identity rather than erasing the record', async () => {
    const { service, store } = build()

    await service.remove(volunteer, 'correct-horse')

    expect(store.anonymisedWith?.name).toBe('Removed account')
    expect(store.anonymisedWith?.email).toBe('deleted-volunteer-1@fasha.invalid')
    expect(store.anonymisedWith?.passwordHash).not.toBe('hash:correct-horse')
  })

  it('breaks the old portfolio address', async () => {
    const { service, store } = build()

    await service.remove(volunteer, 'correct-horse')

    expect(store.anonymisedWith?.portfolioSlug).toMatch(/^removed-/)
  })

  it('asks for the password first', async () => {
    const { service } = build()

    await expect(service.remove(volunteer, 'wrong')).rejects.toThrow('not correct')
  })
})
