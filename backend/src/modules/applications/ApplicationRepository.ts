import { type PrismaClient, ApplicationStatus } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { ApplicationRecord, ApplicationStore, NewApplication } from './ApplicationStore'

const withBothSides = {
  volunteer: { select: { id: true, name: true, email: true } },
  opportunity: {
    select: {
      id: true,
      title: true,
      creatorId: true,
      maxCapacity: true,
      applicationDeadline: true,
      mode: true,
    },
  },
} as const

export class ApplicationRepository extends BaseRepository implements ApplicationStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  create(
    opportunityId: string,
    volunteerId: string,
    input: NewApplication,
  ): Promise<ApplicationRecord> {
    return this.db.application.create({
      data: { ...input, opportunityId, volunteerId },
      include: withBothSides,
    })
  }

  findById(id: string): Promise<ApplicationRecord | null> {
    return this.db.application.findUnique({ where: { id }, include: withBothSides })
  }

  findByVolunteer(volunteerId: string): Promise<ApplicationRecord[]> {
    return this.db.application.findMany({
      where: { volunteerId },
      include: withBothSides,
      orderBy: { createdAt: 'desc' },
    })
  }

  findForOpportunity(opportunityId: string): Promise<ApplicationRecord[]> {
    return this.db.application.findMany({
      where: { opportunityId },
      include: withBothSides,
      orderBy: { createdAt: 'asc' },
    })
  }

  findAccepted(opportunityId: string, volunteerId: string): Promise<ApplicationRecord | null> {
    return this.db.application.findFirst({
      where: { opportunityId, volunteerId, status: ApplicationStatus.ACCEPTED },
      include: withBothSides,
    })
  }

  acceptIfSpace(
    applicationId: string,
    opportunityId: string,
    maxCapacity: number,
  ): Promise<ApplicationRecord | null> {
    return this.db.$transaction(
      async transaction => {
        const taken = await transaction.application.count({
          where: { opportunityId, status: ApplicationStatus.ACCEPTED },
        })

        if (taken >= maxCapacity) return null

        return transaction.application.update({
          where: { id: applicationId },
          data: { status: ApplicationStatus.ACCEPTED },
          include: withBothSides,
        })
      },
      { isolationLevel: 'Serializable' },
    )
  }

  updateStatus(id: string, status: ApplicationStatus): Promise<ApplicationRecord> {
    return this.db.application.update({
      where: { id },
      data: { status },
      include: withBothSides,
    })
  }
}
