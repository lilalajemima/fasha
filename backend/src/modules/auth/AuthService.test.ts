import type { User } from '@prisma/client'
import { describe, expect, it } from 'vitest'
import type { GoogleCheck, GoogleIdentity } from '../../core/security/GoogleVerifier'
import type { Hasher } from '../../core/security/PasswordHasher'
import { TokenService } from '../../core/security/TokenService'
import { AuthService, type AuthResult, type RoleNeeded } from './AuthService'
import type { NewAccount, UserStore, UserWithProfile } from './UserStore'

const tokens = new TokenService('test-secret-value', '1h')

const hasher: Hasher = {
  async hash(plainText: string) {
    return `hash:${plainText}`
  },
  async matches(plainText: string, hash: string) {
    return hash === `hash:${plainText}`
  },
}

const amara: GoogleIdentity = {
  googleId: 'google-amara',
  email: 'amara@example.rw',
  name: 'Amara Mensah',
}

function googleSaying(identity: GoogleIdentity): GoogleCheck {
  return {
    async verify() {
      return identity
    },
  }
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Amara Mensah',
    email: 'amara@example.rw',
    passwordHash: 'hash:correct-horse',
    googleId: null,
    role: 'VOLUNTEER',
    status: 'ACTIVE',
    mustChangePassword: false,
    avatar: null,
    tokenVersion: 0,
    ...overrides,
  } as User
}

class FakeUsers implements UserStore {
  created: { role: string; account: NewAccount }[] = []
  linked: { id: string; googleId: string }[] = []

  constructor(private readonly users: User[] = []) {}

  async findByEmail(email: string) {
    return this.users.find(user => user.email === email) ?? null
  }

  async findByGoogleId(googleId: string) {
    return this.users.find(user => user.googleId === googleId) ?? null
  }

  async findById(id: string) {
    return this.users.find(user => user.id === id) ?? null
  }

  async findWithProfile(): Promise<UserWithProfile | null> {
    return null
  }

  async createVolunteer(account: NewAccount) {
    this.created.push({ role: 'VOLUNTEER', account })

    return makeUser({ id: 'new-1', ...account, role: 'VOLUNTEER' })
  }

  async createOrganisation(account: NewAccount) {
    this.created.push({ role: 'ORGANISATION', account })

    return makeUser({ id: 'new-1', ...account, role: 'ORGANISATION' })
  }

  async updateAccount() {}

  async linkGoogle(id: string, googleId: string) {
    this.linked.push({ id, googleId })
  }
}

function build(users: User[] = [], identity = amara) {
  const store = new FakeUsers(users)

  return { store, service: new AuthService(store, hasher, tokens, googleSaying(identity)) }
}

function signedIn(result: AuthResult | RoleNeeded): AuthResult {
  if ('chooseRole' in result) throw new Error('Expected a signed-in result')

  return result
}

describe('signing in with Google', () => {
  it('signs straight in to the account already tied to that Google id', async () => {
    const { service, store } = build([makeUser({ googleId: 'google-amara' })])

    const result = signedIn(await service.withGoogle('credential', null))

    expect(result.user.id).toBe('user-1')
    expect(tokens.verify(result.token).userId).toBe('user-1')
    expect(store.linked).toEqual([])
  })

  it('ties Google to an existing account with the same address', async () => {
    const { service, store } = build([makeUser()])

    const result = signedIn(await service.withGoogle('credential', null))

    expect(result.user.id).toBe('user-1')
    expect(store.linked).toEqual([{ id: 'user-1', googleId: 'google-amara' }])
    expect(store.created).toEqual([])
  })

  it('refuses when the address is already tied to a different Google account', async () => {
    const { service, store } = build([makeUser({ googleId: 'google-somebody-else' })])

    await expect(service.withGoogle('credential', null)).rejects.toMatchObject({ statusCode: 409 })
    expect(store.linked).toEqual([])
  })

  it('keeps a deactivated account out, and does not link it', async () => {
    const { service, store } = build([makeUser({ status: 'DEACTIVATED' })])

    await expect(service.withGoogle('credential', null)).rejects.toMatchObject({ statusCode: 403 })
    expect(store.linked).toEqual([])
  })

  it('asks somebody new which kind of account they want before making one', async () => {
    const { service, store } = build()

    await expect(service.withGoogle('credential', null)).resolves.toEqual({
      chooseRole: { name: 'Amara Mensah', email: 'amara@example.rw' },
    })
    expect(store.created).toEqual([])
  })

  it('makes a volunteer with no password once they have chosen', async () => {
    const { service, store } = build()

    const result = signedIn(await service.withGoogle('credential', 'VOLUNTEER'))

    expect(store.created).toEqual([{
      role: 'VOLUNTEER',
      account: { name: 'Amara Mensah', email: 'amara@example.rw', passwordHash: null, googleId: 'google-amara' },
    }])
    expect(result.user.hasPassword).toBe(false)
  })

  it('makes an organisation when that is what they chose', async () => {
    const { service, store } = build()

    signedIn(await service.withGoogle('credential', 'ORGANISATION'))

    expect(store.created[0].role).toBe('ORGANISATION')
  })

  it('ignores the role for somebody who already has an account', async () => {
    const { service, store } = build([makeUser({ googleId: 'google-amara' })])

    const result = signedIn(await service.withGoogle('credential', 'ORGANISATION'))

    expect(result.user.role).toBe('VOLUNTEER')
    expect(store.created).toEqual([])
  })

  it('says plainly when the server is not set up for Google', async () => {
    const service = new AuthService(new FakeUsers(), hasher, tokens)

    await expect(service.withGoogle('credential', null)).rejects.toMatchObject({ statusCode: 503 })
  })
})

describe('signing in with a password', () => {
  it('gives somebody who only uses Google the same answer as a wrong password', async () => {
    const { service } = build([makeUser({ passwordHash: null, googleId: 'google-amara' })])

    await expect(service.login('amara@example.rw', 'anything')).rejects.toThrow('Email or password is incorrect')
  })

  it('still works for everybody else', async () => {
    const { service } = build([makeUser()])

    const result = await service.login('amara@example.rw', 'correct-horse')

    expect(result.user.hasPassword).toBe(true)
  })
})
