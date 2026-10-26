import type { PrismaClient } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { ProfileChanges, ProfileStore } from './ProfileStore'

export class ProfileRepository extends BaseRepository implements ProfileStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  async update(userId: string, changes: ProfileChanges): Promise<void> {
    await this.db.volunteerProfile.update({ where: { userId }, data: changes })
  }
}
