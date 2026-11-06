import { OpportunityStatus, type PrismaClient } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { OrganisedRecord, PortfolioRecord, PortfolioStore } from './PortfolioStore'

export class PortfolioRepository extends BaseRepository implements PortfolioStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  findForVolunteer(volunteerId: string): Promise<PortfolioRecord[]> {
    return this.db.portfolioEntry.findMany({
      where: { volunteerId },
      include: {
        opportunity: {
          select: {
            id: true,
            title: true,
            description: true,
            mode: true,
            creatorId: true,
            requiredSkills: true,
            categories: true,
            startsAt: true,
            endsAt: true,
            creator: { select: { name: true, role: true } },
            brief: { select: { name: true } },
          },
        },
      },
      orderBy: { dateCredited: 'desc' },
    })
  }

  /**
   * Organising is a fact the system can prove on its own: approved, published,
   * and it has happened. Hours still require somebody else to verify them.
   * The count is of people whose time was credited, so it is the number that
   * actually turned up rather than the number who said they would.
   */
  async findOrganisedBy(volunteerId: string): Promise<OrganisedRecord[]> {
    const rows = await this.db.opportunity.findMany({
      where: {
        creatorId: volunteerId,
        status: OpportunityStatus.PUBLISHED,
        endsAt: { lt: new Date() },
      },
      select: {
        id: true,
        title: true,
        description: true,
        mode: true,
        sector: true,
        location: true,
        startsAt: true,
        endsAt: true,
        requiredSkills: true,
        categories: true,
        brief: { select: { name: true } },
        _count: { select: { portfolioEntries: true } },
      },
      orderBy: { endsAt: 'desc' },
    })

    return rows.map(({ _count, ...row }) => ({ ...row, people: _count.portfolioEntries }))
  }
}
