import { randomBytes } from 'node:crypto'
import { UserRole, UserStatus } from '@prisma/client'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorisedError,
} from '../../core/errors/HttpErrors'
import type { Hasher } from '../../core/security/PasswordHasher'
import type { TokenPayload } from '../../core/security/TokenService'
import { NOTIFICATION_TYPES, type Notifier } from '../notifications/Notifier'
import type { AccountStore } from './AccountStore'

/**
 * What a signed-in person may do to their own account: change the password,
 * step away for a while, or leave for good.
 *
 * Leaving does not erase the row. Other volunteers' registers, the hours an
 * organiser verified and the applications made to an initiative all point at
 * this account, and deleting it outright would rewrite other people's records.
 * What goes is the identity and the way back in.
 */
export class AccountService {
  constructor(
    private readonly accounts: AccountStore,
    private readonly passwords: Hasher,
    private readonly notifier: Notifier,
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

  async changePassword(
    actor: TokenPayload,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOrFail(actor.userId)

    if (!(await this.passwords.matches(currentPassword, user.passwordHash))) {
      throw new UnauthorisedError('Your current password is not correct')
    }

    if (currentPassword === newPassword) {
      throw new BadRequestError('The new password has to be different from the current one')
    }

    await this.accounts.setPassword(user.id, await this.passwords.hash(newPassword), false)
  }

  async deactivate(actor: TokenPayload, password: string): Promise<void> {
    const user = await this.confirm(actor.userId, password)

    await this.assertNotTheLastAdmin(user.role, user.status)
    await this.accounts.setStatus(user.id, UserStatus.DEACTIVATED, new Date())
  }

  async remove(actor: TokenPayload, password: string): Promise<void> {
    const user = await this.confirm(actor.userId, password)

    await this.assertNotTheLastAdmin(user.role, user.status)
    await this.accounts.anonymise(user.id, {
      name: 'Removed account',
      email: `deleted-${user.id}@fasha.invalid`,
      // Not a password anybody holds: the account can no longer be signed into.
      passwordHash: await this.passwords.hash(randomBytes(24).toString('hex')),
      portfolioSlug: `removed-${randomBytes(6).toString('hex')}`,
    })
  }

  /** Both leaving actions ask for the password again, because neither is reversible by the user. */
  private async confirm(userId: string, password: string) {
    const user = await this.findOrFail(userId)

    if (!(await this.passwords.matches(password, user.passwordHash))) {
      throw new UnauthorisedError('That password is not correct')
    }

    return user
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
