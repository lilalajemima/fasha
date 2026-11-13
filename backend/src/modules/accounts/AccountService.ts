import { randomBytes } from 'node:crypto'
import { UserRole, UserStatus } from '@prisma/client'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorisedError,
} from '../../core/errors/HttpErrors'
import type { GoogleCheck } from '../../core/security/GoogleVerifier'
import type { Hasher } from '../../core/security/PasswordHasher'
import type { TokenPayload, TokenService } from '../../core/security/TokenService'
import { NOTIFICATION_TYPES, type Notifier } from '../notifications/Notifier'
import type { AccountStore } from './AccountStore'

/**
 * How somebody shows it is really them before a change they cannot undo.
 * Usually the password; for somebody who only ever signs in with Google, a
 * fresh Google sign-in for the same Google account.
 */
export type Proof = {
  password: string | null
  googleCredential: string | null
}

/**
 * What a signed-in person may do to their own account: change the password,
 * step away for a while, or leave for good.
 *
 * Leaving does not erase the row. Other volunteers' registers, the hours an
 * organiser verified and the applications made to an initiative all point at
 * this account, and deleting it outright would rewrite other people's
 * records. What goes is the identity and the way back in.
 */
export class AccountService {
  constructor(
    private readonly accounts: AccountStore,
    private readonly passwords: Hasher,
    private readonly notifier: Notifier,
    private readonly tokens: TokenService,
    private readonly google: GoogleCheck | null = null,
  ) {}

  /**
   * Somebody cannot get in. Fasha sends no email, so the only honest thing it
   * can do is tell the community admins that this person is locked out; they
   * issue a temporary password from the user table.
   *
   * It answers the same way whether or not the address exists. A page that
   * said "no such account" would be a way to find out who has one.
   */
  async forgotten(email: string): Promise<void> {
    const account = await this.accounts.findByEmail(email.trim())

    if (!account || account.status === UserStatus.DELETED) return

    const admins = await this.accounts.list({
      search: null,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    })

    await Promise.all(
      admins.map(admin =>
        this.notifier.send(
          admin.id,
          NOTIFICATION_TYPES.passwordHelp,
          `${account.name} (${account.email}) cannot sign in and has asked for a new password.`,
        ),
      ),
    )
  }

  /**
   * Changing the password ends every other session: the version on the account
   * moves on, so tokens handed out before now fail at the door.
   *
   * It returns a replacement token because the person doing this is holding
   * one of those stale tokens themselves, and being thrown out of the app the
   * moment you secure it would be a strange way to reward the habit.
   */
  async changePassword(
    actor: TokenPayload,
    proof: Proof,
    newPassword: string,
  ): Promise<string> {
    const user = await this.findOrFail(actor.userId)

    await this.prove(user, proof, 'Your current password is not correct')

    if (proof.password !== null && proof.password === newPassword) {
      throw new BadRequestError('The new password has to be different from the current one')
    }

    const tokenVersion = await this.accounts.setPassword(
      user.id,
      await this.passwords.hash(newPassword),
      false,
    )

    return this.tokens.issue({ userId: user.id, role: user.role, tokenVersion })
  }

  async deactivate(actor: TokenPayload, proof: Proof): Promise<void> {
    const user = await this.confirm(actor.userId, proof)

    await this.assertNotTheLastAdmin(user.role, user.status)
    await this.accounts.setStatus(user.id, UserStatus.DEACTIVATED, new Date())
  }

  async remove(actor: TokenPayload, proof: Proof): Promise<void> {
    const user = await this.confirm(actor.userId, proof)

    await this.assertNotTheLastAdmin(user.role, user.status)
    await this.accounts.anonymise(user.id, {
      name: 'Removed account',
      email: `deleted-${user.id}@fasha.invalid`,
      passwordHash: await this.passwords.hash(randomBytes(24).toString('hex')),
      portfolioSlug: `removed-${randomBytes(6).toString('hex')}`,
    })
  }

  // Both leaving actions ask for the password again, because neither is
  // reversible by the user.
  private async confirm(userId: string, proof: Proof) {
    const user = await this.findOrFail(userId)

    await this.prove(user, proof, 'That password is not correct')

    return user
  }

  private async prove(
    user: { passwordHash: string | null; googleId: string | null },
    proof: Proof,
    wrongPassword: string,
  ): Promise<void> {
    if (proof.password !== null && user.passwordHash) {
      if (await this.passwords.matches(proof.password, user.passwordHash)) return

      throw new UnauthorisedError(wrongPassword)
    }

    if (proof.googleCredential !== null && user.googleId && this.google) {
      const identity = await this.google.verify(proof.googleCredential)

      if (identity.googleId === user.googleId) return

      throw new UnauthorisedError('That is not the Google account this Fasha account uses.')
    }

    throw new UnauthorisedError(
      !user.passwordHash
        ? 'Confirm with Google that it is you first.'
        : wrongPassword,
    )
  }

  private async assertNotTheLastAdmin(role: UserRole, status: UserStatus): Promise<void> {
    if (role !== UserRole.ADMIN || status !== UserStatus.ACTIVE) {
      return
    }

    if ((await this.accounts.countActiveAdmins()) <= 1) {
      throw new ConflictError(
        'You are the only active community admin. Make somebody else an admin first.',
      )
    }
  }

  private async findOrFail(userId: string) {
    const user = await this.accounts.findById(userId)

    if (!user || user.status === UserStatus.DELETED) {
      throw new NotFoundError('Account no longer exists')
    }

    return user
  }
}
