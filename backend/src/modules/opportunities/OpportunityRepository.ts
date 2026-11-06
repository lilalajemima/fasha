import {
  type PrismaClient,
  ApplicationStatus,
  OpportunityStatus,
  SubmissionStatus,
} from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type {
  ActivityCount,
  FeedFilter,
  NewOpportunity,
  OpportunityRecord,
  OpportunityStore,
  WorkloadRow,
} from './OpportunityStore'

const withCreator = {
  creator: { select: { id: true, name: true, role: true } },
  // The name, never the megabyte: the file has its own endpoint.
  brief: { select: { name: true } },
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
    const { brief, ...fields } = input

    return this.db.opportunity.create({
      data: {
        ...fields,
        creatorId,
        status,
        ...(brief ? { brief: { create: { name: brief.name, data: brief.data } } } : {}),
      },
      include: withCreator,
    })
  }

  findBrief(id: string): Promise<{ name: string; data: string } | null> {
    return this.db.opportunityBrief.findUnique({
      where: { opportunityId: id },
      select: { name: true, data: true },
    })
  }

  /**
   * The oversight calendar: every opportunity, in any state, that touches the
   * window. Something proposed long ago but happening next month still counts,
   * so the window is tested against the dates that matter rather than against
   * when the row was written.
   */
  findSince(since: Date): Promise<OpportunityRecord[]> {
    return this.db.opportunity.findMany({
      where: {
        OR: [
          { startsAt: { gte: since } },
          { endsAt: { gte: since } },
          { applicationDeadline: { gte: since } },
        ],
      },
      include: withCreator,
      orderBy: { applicationDeadline: 'asc' },
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

  /**
   * Two grouped counts rather than one query per opportunity, so the workspace
   * header costs the same whether an organiser runs two events or two hundred.
   */
  async countWorkload(creatorId: string): Promise<WorkloadRow[]> {
    const [applications, deliverables] = await Promise.all([
      this.db.application.groupBy({
        by: ['opportunityId', 'status'],
        where: { opportunity: { creatorId } },
        _count: { _all: true },
      }),
      this.db.taskSubmission.groupBy({
        by: ['opportunityId', 'status'],
        where: { opportunity: { creatorId } },
        _count: { _all: true },
      }),
    ])

    const rows = new Map<string, WorkloadRow>()

    const rowFor = (opportunityId: string): WorkloadRow => {
      const held = rows.get(opportunityId)

      if (held) return held

      const fresh: WorkloadRow = {
        opportunityId,
        pendingApplications: 0,
        acceptedApplications: 0,
        pendingDeliverables: 0,
      }

      rows.set(opportunityId, fresh)

      return fresh
    }

    for (const group of applications) {
      const row = rowFor(group.opportunityId)

      if (group.status === ApplicationStatus.PENDING) {
        row.pendingApplications = group._count._all
      }

      if (group.status === ApplicationStatus.ACCEPTED) {
        row.acceptedApplications = group._count._all
      }
    }

    for (const group of deliverables) {
      if (group.status !== SubmissionStatus.PENDING) continue

      rowFor(group.opportunityId).pendingDeliverables = group._count._all
    }

    return [...rows.values()]
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

  async update(
    id: string,
    input: NewOpportunity,
    status: OpportunityStatus,
  ): Promise<OpportunityRecord> {
    const { brief, ...fields } = input

    // `delete: true` on a one-to-one throws when there is nothing to delete,
    // so taking a brief away is its own statement, in the same transaction.
    const [, updated] = await this.db.$transaction([
      this.db.opportunityBrief.deleteMany({
        where: brief === undefined ? { opportunityId: '' } : { opportunityId: id },
      }),
      this.db.opportunity.update({
        where: { id },
        data: {
          ...fields,
          status,
          ...(brief ? { brief: { create: { name: brief.name, data: brief.data } } } : {}),
        },
        include: withCreator,
      }),
    ])

    return updated
  }

  closeApplications(id: string, at: Date): Promise<OpportunityRecord> {
    return this.db.opportunity.update({
      where: { id },
      data: { applicationDeadline: at },
      include: withCreator,
    })
  }

  async remove(id: string): Promise<void> {
    await this.db.opportunity.delete({ where: { id } })
  }

  /**
   * Nobody checked in without applying first, so applications stand in for
   * attendance here and the guard stays three counts rather than four.
   */
  async countActivity(id: string): Promise<ActivityCount> {
    const [applications, deliverables, credited] = await Promise.all([
      this.db.application.count({ where: { opportunityId: id } }),
      this.db.taskSubmission.count({ where: { opportunityId: id } }),
      this.db.portfolioEntry.count({ where: { opportunityId: id } }),
    ])

    return { applications, deliverables, credited }
  }

  async setQrToken(id: string, qrToken: string): Promise<void> {
    await this.db.opportunity.update({ where: { id }, data: { qrToken } })
  }
}
