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
  slugs: string[] = []
  profiles = new Map<string, UserWithProfile>()

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

  async findWithProfile(id: string): Promise<UserWithProfile | null> {
    return this.profiles.get(id) ?? null
  }

  async createVolunteer(account: NewAccount, portfolioSlug: string) {
    this.created.push({ role: 'VOLUNTEER', account })
    this.slugs.push(portfolioSlug)

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

describe('signing up with an email and password', () => {
  const amaraSigningUp = {
    name: 'Amara Mensah',
    email: 'amara@example.rw',
    password: 'a-long-password',
    role: 'VOLUNTEER' as const,
  }

  it('refuses an address that already has an account', async () => {
    const { service, store } = build([makeUser()])

    await expect(service.register(amaraSigningUp)).rejects.toMatchObject({ statusCode: 409 })
    expect(store.created).toEqual([])
  })

  it('stores the password hashed, never as it was typed', async () => {
    const { service, store } = build()

    await service.register(amaraSigningUp)

    expect(store.created[0].account.passwordHash).toBe('hash:a-long-password')
    expect(JSON.stringify(store.created)).not.toContain('"a-long-password"')
  })

  it('gives a new volunteer a portfolio address made from their name', async () => {
    const { service, store } = build()

    await service.register(amaraSigningUp)

    expect(store.slugs[0]).toMatch(/^amara-mensah-[a-z0-9]{1,5}$/)
  })

  it('still makes a usable address from a name with no plain letters in it', async () => {
    const { service, store } = build()

    await service.register({ ...amaraSigningUp, name: 'Ñ!' })

    expect(store.slugs[0]).toMatch(/^[a-z0-9-]+$/)
    expect(store.slugs[0].startsWith('-')).toBe(false)
  })

  it('makes an organisation without a portfolio', async () => {
    const { service, store } = build()

    const result = await service.register({ ...amaraSigningUp, role: 'ORGANISATION' })

    expect(store.created[0].role).toBe('ORGANISATION')
    expect(store.slugs).toEqual([])
    expect(result.user.role).toBe('ORGANISATION')
  })

  it('signs them straight in with a token for the new account', async () => {
    const { service } = build()

    const result = await service.register(amaraSigningUp)

    expect(tokens.verify(result.token)).toMatchObject({ userId: 'new-1', role: 'VOLUNTEER' })
  })
})

describe('reading your own account', () => {
  it('reports an account that has gone', async () => {
    const { service } = build()

    await expect(service.profileOf('gone')).rejects.toMatchObject({ statusCode: 404 })
  })

  it('never sends the password hash, the Google id or the token version', async () => {
    const { service, store } = build()

    store.profiles.set('user-1', { ...makeUser({ googleId: 'google-amara', tokenVersion: 3 }), profile: null })

    const view = await service.profileOf('user-1')
    const sent = JSON.stringify(view)

    expect(view.user.hasPassword).toBe(true)
    expect(sent).not.toContain('hash:correct-horse')
    expect(sent).not.toContain('google-amara')
    expect('tokenVersion' in view.user).toBe(false)
  })
})
