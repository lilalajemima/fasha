import type { User, UserRole } from '@prisma/client'
import { ConflictError, NotFoundError, UnauthorisedError } from '../../core/errors/HttpErrors'
import type { PasswordHasher } from '../../core/security/PasswordHasher'
import type { TokenService } from '../../core/security/TokenService'
import { toProfileView, type ProfileView } from '../profile/ProfileView'
import type { UserStore } from './UserStore'

export type RegisterInput = {
  name: string
  email: string
  password: string
  role: 'VOLUNTEER' | 'ORGANISATION'
}

export type PublicUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export type AuthResult = {
  token: string
  user: PublicUser
}

export class AuthService {
  constructor(
    private readonly users: UserStore,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.users.findByEmail(input.email)

    if (existing) {
      throw new ConflictError('An account with that email already exists')
    }

    const account = {
      name: input.name,
      email: input.email,
      passwordHash: await this.passwords.hash(input.password),
    }

    const user = input.role === 'VOLUNTEER'
      ? await this.users.createVolunteer(account, this.buildPortfolioSlug(input.name))
      : await this.users.createOrganisation(account)

    return this.authResultFor(user)
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.users.findByEmail(email)
    const passwordMatches = user
      ? await this.passwords.matches(password, user.passwordHash)
      : false

    if (!user || !passwordMatches) {
      throw new UnauthorisedError('Email or password is incorrect')
    }

    return this.authResultFor(user)
  }

  async profileOf(userId: string): Promise<ProfileView> {
    const user = await this.users.findWithProfile(userId)

    if (!user) {
      throw new NotFoundError('Account no longer exists')
    }

    return toProfileView(user)
  }

  private authResultFor(user: User): AuthResult {
    return {
      token: this.tokens.issue({ userId: user.id, role: user.role }),
      user: this.toPublicUser(user),
    }
  }

  private toPublicUser(user: User): PublicUser {
    return { id: user.id, name: user.name, email: user.email, role: user.role }
  }

  private buildPortfolioSlug(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const suffix = Math.random().toString(36).slice(2, 7)
    return `${base || 'volunteer'}-${suffix}`
  }
}
