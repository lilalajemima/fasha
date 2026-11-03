import { type CheckInMethod, type PrismaClient } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { CheckinRecord, CheckinStore } from './CheckinStore'

const withBothSides = {
  volunteer: { select: { id: true, name: true } },
  opportunity: {
    select: { id: true, title: true, creatorId: true, requiredSkills: true, qrToken: true },
  },
} as const

export class CheckinRepository extends BaseRepository implements CheckinStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  create(
    opportunityId: string,
    volunteerId: string,
    method: CheckInMethod,
  ): Promise<CheckinRecord> {
    return this.db.checkin.create({
      data: { opportunityId, volunteerId, method },
      include: withBothSides,
    })
  }

  findById(id: string): Promise<CheckinRecord | null> {
    return this.db.checkin.findUnique({ where: { id }, include: withBothSides })
  }

  findForOpportunity(opportunityId: string): Promise<CheckinRecord[]> {
    return this.db.checkin.findMany({
      where: { opportunityId },
      include: withBothSides,
      orderBy: { checkinTime: 'asc' },
    })
  }

  findOne(opportunityId: string, volunteerId: string): Promise<CheckinRecord | null> {
    return this.db.checkin.findFirst({
      where: { opportunityId, volunteerId },
      include: withBothSides,
    })
  }

  findOpenForVolunteer(volunteerId: string): Promise<CheckinRecord[]> {
    return this.db.checkin.findMany({
      where: { volunteerId, checkoutTime: null },
      include: withBothSides,
      orderBy: { checkinTime: 'desc' },
    })
  }

  checkOutAndCredit(
    id: string,
    leftAt: Date,
    hours: number,
    skills: string[],
  ): Promise<CheckinRecord> {
    return this.db.$transaction(async transaction => {
      const checkin = await transaction.checkin.update({
        where: { id },
        data: { checkoutTime: leftAt },
        include: withBothSides,
      })

      await transaction.portfolioEntry.create({
        data: {
          volunteerId: checkin.volunteerId,
          opportunityId: checkin.opportunityId,
          hoursCredited: hours,
          skillsCredited: skills,
        },
      })

      return checkin
    })
  }
}
