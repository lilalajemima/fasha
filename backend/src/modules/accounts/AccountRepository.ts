import { type PrismaClient, type User, UserRole, UserStatus } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { AccountRow, AccountStore, Anonymised, UserFilter } from './AccountStore'

const caseInsensitive = 'insensitive' as const

const columns = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  mustChangePassword: true,
  createdAt: true,
  deactivatedAt: true,
} as const

export class AccountRepository extends BaseRepository implements AccountStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } })
  }

  findByEmail(email: string): Promise<AccountRow | null> {
    return this.db.user.findUnique({ where: { email: email.toLowerCase() }, select: columns })
  }

  findRow(id: string): Promise<AccountRow | null> {
    return this.db.user.findUnique({ where: { id }, select: columns })
  }

  list(filter: UserFilter): Promise<AccountRow[]> {
    return this.db.user.findMany({
      where: {
        ...(filter.role ? { role: filter.role } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.search
          ? {
              OR: [
                { name: { contains: filter.search, mode: caseInsensitive } },
                { email: { contains: filter.search, mode: caseInsensitive } },
              ],
            }
          : {}),
      },
      select: columns,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
  }

  countActiveAdmins(): Promise<number> {
    return this.db.user.count({ where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE } })
  }

  async setPassword(id: string, passwordHash: string, mustChange: boolean): Promise<void> {
    await this.db.user.update({
      where: { id },
      data: { passwordHash, mustChangePassword: mustChange },
    })
  }

  async setStatus(id: string, status: UserStatus, deactivatedAt: Date | null): Promise<void> {
    await this.db.user.update({ where: { id }, data: { status, deactivatedAt } })
  }

  /**
   * One transaction: the account and the profile have to lose their identity
   * together, or a half-deleted person is left behind.
   */
  async anonymise(id: string, replacement: Anonymised): Promise<void> {
    await this.db.$transaction([
      this.db.user.update({
        where: { id },
        data: {
          name: replacement.name,
          email: replacement.email,
          passwordHash: replacement.passwordHash,
          status: UserStatus.DELETED,
          mustChangePassword: false,
          deletedAt: new Date(),
        },
      }),
      this.db.volunteerProfile.updateMany({
        where: { userId: id },
        data: {
          skills: [],
          interests: [],
          availabilitySlots: [],
          location: null,
          sector: null,
          // The old address stops resolving, so a shared portfolio link dies with the account.
          portfolioSlug: replacement.portfolioSlug,
        },
      }),
    ])
  }
}
