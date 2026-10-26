import { type PrismaClient, type User, UserRole } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { NewAccount, UserStore, UserWithProfile } from './UserStore'

export class UserRepository extends BaseRepository implements UserStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } })
  }

  findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } })
  }

  findWithProfile(id: string): Promise<UserWithProfile | null> {
    return this.db.user.findUnique({ where: { id }, include: { profile: true } })
  }

  createVolunteer(account: NewAccount, portfolioSlug: string): Promise<User> {
    return this.db.user.create({
      data: {
        ...account,
        role: UserRole.VOLUNTEER,
        profile: { create: { portfolioSlug } },
      },
    })
  }

  createOrganisation(account: NewAccount): Promise<User> {
    return this.db.user.create({
      data: { ...account, role: UserRole.ORGANISATION },
    })
  }

  async updateName(id: string, name: string): Promise<void> {
    await this.db.user.update({ where: { id }, data: { name } })
  }
}
