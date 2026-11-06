import { type PrismaClient, SubmissionStatus } from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type { NewSubmission, SubmissionRecord, SubmissionStore } from './SubmissionStore'

const withBothSides = {
  volunteer: { select: { id: true, name: true } },
  opportunity: { select: { id: true, title: true, creatorId: true, requiredSkills: true } },
} as const

const OPEN_STATUSES = [SubmissionStatus.PENDING, SubmissionStatus.APPROVED]

export class SubmissionRepository extends BaseRepository implements SubmissionStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  create(
    opportunityId: string,
    volunteerId: string,
    input: NewSubmission,
  ): Promise<SubmissionRecord> {
    return this.db.taskSubmission.create({
      data: { ...input, opportunityId, volunteerId },
      include: withBothSides,
    })
  }

  findById(id: string): Promise<SubmissionRecord | null> {
    return this.db.taskSubmission.findUnique({ where: { id }, include: withBothSides })
  }

  findByVolunteer(volunteerId: string): Promise<SubmissionRecord[]> {
    return this.db.taskSubmission.findMany({
      where: { volunteerId },
      include: withBothSides,
      orderBy: { createdAt: 'desc' },
    })
  }

  findForOpportunity(opportunityId: string): Promise<SubmissionRecord[]> {
    return this.db.taskSubmission.findMany({
      where: { opportunityId },
      include: withBothSides,
      orderBy: { createdAt: 'asc' },
    })
  }

  findForCreator(creatorId: string): Promise<SubmissionRecord[]> {
    return this.db.taskSubmission.findMany({
      where: { opportunity: { creatorId } },
      include: withBothSides,
      orderBy: { createdAt: 'desc' },
    })
  }

  findOpen(opportunityId: string, volunteerId: string): Promise<SubmissionRecord | null> {
    return this.db.taskSubmission.findFirst({
      where: { opportunityId, volunteerId, status: { in: OPEN_STATUSES } },
      include: withBothSides,
    })
  }

  reject(id: string, reviewNote: string): Promise<SubmissionRecord> {
    return this.db.taskSubmission.update({
      where: { id },
      data: { status: SubmissionStatus.REJECTED, reviewNote },
      include: withBothSides,
    })
  }

  approveAndCredit(id: string, hours: number, skills: string[]): Promise<SubmissionRecord> {
    return this.db.$transaction(async transaction => {
      const submission = await transaction.taskSubmission.update({
        where: { id },
        data: { status: SubmissionStatus.APPROVED },
        include: withBothSides,
      })

      await transaction.portfolioEntry.create({
        data: {
          volunteerId: submission.volunteerId,
          opportunityId: submission.opportunityId,
          hoursCredited: hours,
          skillsCredited: skills,
        },
      })

      return submission
    })
  }
}
