import { OpportunityStatus, type PrismaClient } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { PortfolioRecord, PortfolioStore } from './PortfolioStore'

export class PortfolioRepository extends BaseRepository implements PortfolioStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  findForVolunteer(volunteerId: string): Promise<PortfolioRecord[]> {
    return this.db.portfolioEntry.findMany({
      where: { volunteerId },
      include: { opportunity: { select: { id: true, title: true, mode: true } } },
      orderBy: { dateCredited: 'desc' },
    })
  }

  /**
   * Organising is a fact the system can prove on its own: approved, published,
   * and it has happened. Hours still require somebody else to verify them.
   */
  countOrganised(volunteerId: string): Promise<number> {
    return this.db.opportunity.count({
      where: {
        creatorId: volunteerId,
        status: OpportunityStatus.PUBLISHED,
        endsAt: { lt: new Date() },
      },
    })
  }
}