import { randomBytes } from 'node:crypto'
import { UserRole, UserStatus } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError } from '../../core/errors/HttpErrors'
import type { Hasher } from '../../core/security/PasswordHasher'
import type { TokenPayload } from '../../core/security/TokenService'
import type { AccountStore, UserFilter } from './AccountStore'
import { toUserView, type UserView } from './UserView'

/**
 * User management for the community admin.
 *
 * Fasha has no email service, so a forgotten password is recovered the way a
 * sector office already works: the person asks the admin, who issues a
 * temporary password in front of them. It is shown once and the account is
 * forced to change it at the next sign-in, so the admin does not end up
 * holding somebody else's credentials.
 */
export class UserAdminService {
  constructor(
    private readonly accounts: AccountStore,
    private readonly passwords: Hasher,
  ) {}

  async list(filter: UserFilter): Promise<UserView[]> {
    const rows = await this.accounts.list(filter)

    return rows.map(toUserView)
  }

  async setStatus(actor: TokenPayload, userId: string, status: UserStatus): Promise<UserView> {
    const user = await this.findOrFail(userId)

    this.assertNotSelf(actor, userId, 'change your own status')

    if (user.status === UserStatus.DELETED) {
      throw new ConflictError('That account was deleted and cannot be restored')
    }

    if (user.status === status) {
      throw new ConflictError(`That account is already ${status.toLowerCase()}`)
    }

    if (status === UserStatus.DEACTIVATED) {
      await this.assertNotTheLastAdmin(user.role, user.status)
    }

    await this.accounts.setStatus(
      userId,
      status,
      status === UserStatus.DEACTIVATED ? new Date() : null,
    )

    return this.viewOf(userId)
  }

  async issueTemporaryPassword(
    actor: TokenPayload,
    userId: string,
  ): Promise<{ user: UserView; temporaryPassword: string }> {
    const user = await this.findOrFail(userId)

    this.assertNotSelf(actor, userId, 'reset your own password this way')

    if (user.status === UserStatus.DELETED) {
      throw new ConflictError('That account was deleted')
    }

    const temporaryPassword = `fasha-${randomBytes(4).toString('hex')}`

    await this.accounts.setPassword(userId, await this.passwords.hash(temporaryPassword), true)

    return { user: await this.viewOf(userId), temporaryPassword }
  }

  async remove(actor: TokenPayload, userId: string): Promise<void> {
    const user = await this.findOrFail(userId)

    this.assertNotSelf(actor, userId, 'delete your own account from here')

    if (user.status === UserStatus.DELETED) {
      throw new ConflictError('That account has already been deleted')
    }

    await this.assertNotTheLastAdmin(user.role, user.status)
    await this.accounts.anonymise(userId, {
      name: 'Removed account',
      email: `deleted-${userId}@fasha.invalid`,
      passwordHash: await this.passwords.hash(randomBytes(24).toString('hex')),
      portfolioSlug: `removed-${randomBytes(6).toString('hex')}`,
    })
  }

  private assertNotSelf(actor: TokenPayload, userId: string, action: string): void {
    if (actor.userId === userId) {
      throw new ForbiddenError(`You cannot ${action}`)
    }
  }

  private async assertNotTheLastAdmin(role: UserRole, status: UserStatus): Promise<void> {
    if (role !== UserRole.ADMIN || status !== UserStatus.ACTIVE) {
      return
    }

    if ((await this.accounts.countActiveAdmins()) <= 1) {
      throw new ConflictError('That is the only active community admin')
    }
  }

  private async findOrFail(userId: string) {
    const user = await this.accounts.findById(userId)

    if (!user) {
      throw new NotFoundError('No account with that id')
    }

    return user
  }

  private async viewOf(userId: string): Promise<UserView> {
    const row = await this.accounts.findRow(userId)

    if (!row) {
      throw new NotFoundError('No account with that id')
    }

    return toUserView(row)
  }
}
