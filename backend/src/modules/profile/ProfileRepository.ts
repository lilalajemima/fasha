import type { PrismaClient } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { PortfolioOwner, ProfileChanges, ProfileStore } from './ProfileStore'

export class ProfileRepository extends BaseRepository implements ProfileStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  async update(userId: string, changes: ProfileChanges): Promise<void> {
    await this.db.volunteerProfile.update({ where: { userId }, data: changes })
  }

  findByUserId(userId: string): Promise<PortfolioOwner | null> {
    return this.ownerWhere({ userId })
  }

  findBySlug(slug: string): Promise<PortfolioOwner | null> {
    return this.ownerWhere({ portfolioSlug: slug })
  }

  private async ownerWhere(
    where: { userId: string } | { portfolioSlug: string },
  ): Promise<PortfolioOwner | null> {
    const profile = await this.db.volunteerProfile.findUnique({
      where,
      include: { user: { select: { name: true, avatar: true, bio: true } } },
    })

    if (!profile) return null

    return {
      userId: profile.userId,
      name: profile.user.name,
      portfolioSlug: profile.portfolioSlug,
      avatar: profile.user.avatar,
      bio: profile.user.bio,
    }
  }
}
