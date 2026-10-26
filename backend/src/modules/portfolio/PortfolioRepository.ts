import type { PrismaClient } from '@prisma/client'
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
}
