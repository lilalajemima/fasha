import { type User, type UserRole, UserStatus } from '@prisma/client'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorisedError,
  UnavailableError,
} from '../../core/errors/HttpErrors'
import type { GoogleCheck } from '../../core/security/GoogleVerifier'
import type { Hasher } from '../../core/security/PasswordHasher'
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
  mustChangePassword: boolean
  avatar: string | null
  hasPassword: boolean
}

export type AuthResult = {
  token: string
  user: PublicUser
}

/**
 * Google confirmed who this is, but Fasha has never seen them and does not
 * know yet whether they are here to volunteer or to organise.
 */
export type RoleNeeded = {
  chooseRole: { name: string; email: string }
}

export type JoiningRole = 'VOLUNTEER' | 'ORGANISATION'

export class AuthService {
  constructor(
    private readonly users: UserStore,
    private readonly passwords: Hasher,
    private readonly tokens: TokenService,
    private readonly google: GoogleCheck | null = null,
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
    // Somebody who joined with Google has no password to match, and gets the
    // same answer as a wrong one.
    const passwordMatches = user?.passwordHash
      ? await this.passwords.matches(password, user.passwordHash)
      : false

    // A deleted account keeps its row, so the generic answer covers it too:
    // nobody learns from this endpoint whether an address was ever registered.
    if (!user || !passwordMatches || user.status === UserStatus.DELETED) {
      throw new UnauthorisedError('Email or password is incorrect')
    }

    if (user.status === UserStatus.DEACTIVATED) {
      throw new ForbiddenError(
        'This account is deactivated. Ask the community admin to restore it.',
      )
    }

    return this.authResultFor(user)
  }

  /**
   * Signing in and joining with Google are the same request: the browser does
   * not know which one it is until the server looks.
   *
   * An account already tied to this Google id signs straight in. Otherwise an
   * account with the same address is tied to it now, which is safe only
   * because Google has confirmed the person owns that address. Somebody new
   * needs a role first: without one this answers with what Google said, and
   * the browser asks and sends the same credential back with the choice.
   */
  async withGoogle(credential: string, role: JoiningRole | null): Promise<AuthResult | RoleNeeded> {
    if (!this.google) {
      throw new UnavailableError('Google sign-in is not set up on this server yet.')
    }

    const identity = await this.google.verify(credential)
    const linked = await this.users.findByGoogleId(identity.googleId)

    if (linked) return this.signInAs(linked)

    const existing = await this.users.findByEmail(identity.email)

    if (existing) {
      if (existing.googleId && existing.googleId !== identity.googleId) {
        throw new ConflictError('That email is already linked to a different Google account.')
      }

      const user = this.assertCanSignIn(existing)

      await this.users.linkGoogle(user.id, identity.googleId)

      return this.authResultFor({ ...user, googleId: identity.googleId })
    }

    if (!role) {
      return { chooseRole: { name: identity.name, email: identity.email } }
    }

    const account = {
      name: identity.name,
      email: identity.email,
      passwordHash: null,
      googleId: identity.googleId,
    }

    const user = role === 'VOLUNTEER'
      ? await this.users.createVolunteer(account, this.buildPortfolioSlug(identity.name))
      : await this.users.createOrganisation(account)

    return this.authResultFor(user)
  }

  async profileOf(userId: string): Promise<ProfileView> {
    const user = await this.users.findWithProfile(userId)

    if (!user) {
      throw new NotFoundError('Account no longer exists')
    }

    return toProfileView(user)
  }

  private signInAs(user: User): AuthResult {
    return this.authResultFor(this.assertCanSignIn(user))
  }

  private assertCanSignIn(user: User): User {
    if (user.status === UserStatus.DELETED) {
      throw new UnauthorisedError('That Google sign-in could not be confirmed. Try again.')
    }

    if (user.status === UserStatus.DEACTIVATED) {
      throw new ForbiddenError(
        'This account is deactivated. Ask the community admin to restore it.',
      )
    }

    return user
  }

  private authResultFor(user: User): AuthResult {
    return {
      token: this.tokens.issue({
        userId: user.id,
        role: user.role,
        tokenVersion: user.tokenVersion,
      }),
      user: this.toPublicUser(user),
    }
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      avatar: user.avatar,
      hasPassword: user.passwordHash !== null,
    }
  }

  private buildPortfolioSlug(name: string): string {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const suffix = Math.random().toString(36).slice(2, 7)
    return `${base || 'volunteer'}-${suffix}`
  }
}
