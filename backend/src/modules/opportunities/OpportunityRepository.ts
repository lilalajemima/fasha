import { type PrismaClient, OpportunityStatus } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type {
  FeedFilter,
  NewOpportunity,
  OpportunityRecord,
  OpportunityStore,
} from './OpportunityStore'

const withCreator = {
  creator: { select: { id: true, name: true, role: true } },
} as const

const caseInsensitive = 'insensitive' as const

export class OpportunityRepository extends BaseRepository implements OpportunityStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  create(
    creatorId: string,
    status: OpportunityStatus,
    input: NewOpportunity,
  ): Promise<OpportunityRecord> {
    return this.db.opportunity.create({
      data: { ...input, creatorId, status },
      include: withCreator,
    })
  }

  findPublished(filter: FeedFilter): Promise<OpportunityRecord[]> {
    return this.db.opportunity.findMany({
      where: {
        status: OpportunityStatus.PUBLISHED,
        applicationDeadline: { gte: new Date() },
        ...(filter.mode ? { mode: filter.mode } : {}),
        ...(filter.sector ? { sector: filter.sector } : {}),
        ...(filter.search
          ? {
              OR: [
                { title: { contains: filter.search, mode: caseInsensitive } },
                { description: { contains: filter.search, mode: caseInsensitive } },
              ],
            }
          : {}),
      },
      include: withCreator,
      orderBy: { applicationDeadline: 'asc' },
    })
  }

  findById(id: string): Promise<OpportunityRecord | null> {
    return this.db.opportunity.findUnique({ where: { id }, include: withCreator })
  }

  findCreatedBy(creatorId: string): Promise<OpportunityRecord[]> {
    return this.db.opportunity.findMany({
      where: { creatorId },
      include: withCreator,
      orderBy: { createdAt: 'desc' },
    })
  }

  findAwaitingApproval(): Promise<OpportunityRecord[]> {
    return this.db.opportunity.findMany({
      where: { status: OpportunityStatus.PENDING_APPROVAL },
      include: withCreator,
      orderBy: { createdAt: 'asc' },
    })
  }

  updateStatus(
    id: string,
    status: OpportunityStatus,
    reviewNote: string | null,
  ): Promise<OpportunityRecord> {
    return this.db.opportunity.update({
      where: { id },
      data: { status, reviewNote, reviewedAt: new Date() },
      include: withCreator,
    })
  }

  async setQrToken(id: string, qrToken: string): Promise<void> {
    await this.db.opportunity.update({ where: { id }, data: { qrToken } })
  }
}
