import { type PrismaClient, UserRole } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'

export type NewAccount = {
  name: string
  email: string
  passwordHash: string
}

export class UserRepository extends BaseRepository {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  findByEmail(email: string) {
    return this.db.user.findUnique({ where: { email } })
  }

  findById(id: string) {
    return this.db.user.findUnique({ where: { id } })
  }

  findWithProfile(id: string) {
    return this.db.user.findUnique({ where: { id }, include: { profile: true } })
  }

  createVolunteer(account: NewAccount, portfolioSlug: string) {
    return this.db.user.create({
      data: {
        ...account,
        role: UserRole.VOLUNTEER,
        profile: { create: { portfolioSlug } },
      },
    })
  }

  createOrganisation(account: NewAccount) {
    return this.db.user.create({
      data: { ...account, role: UserRole.ORGANISATION },
    })
  }
}
