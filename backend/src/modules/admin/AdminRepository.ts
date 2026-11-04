import {
  ApplicationStatus,
  OpportunityStatus,
  type PrismaClient,
  SubmissionStatus,
  UserRole,
} from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type {
  ActivityRow,
  AdminStore,
  AttendanceRow,
  PeriodTally,
  ReportFilter,
  SectorTally,
  Window,
} from './AdminStore'

export class AdminRepository extends BaseRepository implements AdminStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  async tally(window: Window): Promise<PeriodTally> {
    const within = { gte: window.from, lte: window.to }

    const [opportunitiesPosted, citizenProposed, published, acceptedPlaces, checkedIn, hours] =
      await Promise.all([
        this.db.opportunity.count({ where: { createdAt: within } }),
        this.db.opportunity.count({
          where: { createdAt: within, creator: { role: UserRole.VOLUNTEER } },
        }),
        this.db.opportunity.count({
          where: { createdAt: within, status: OpportunityStatus.PUBLISHED },
        }),
        this.db.application.count({
          where: { createdAt: within, status: ApplicationStatus.ACCEPTED },
        }),
        this.db.checkin.count({ where: { checkinTime: within } }),
        this.db.portfolioEntry.aggregate({
          _sum: { hoursCredited: true },
          where: { dateCredited: within },
        }),
      ])

    return {
      opportunitiesPosted,
      citizenProposed,
      published,
      acceptedPlaces,
      checkedIn,
      hoursCredited: Math.round((hours._sum.hoursCredited ?? 0) * 100) / 100,
    }
  }

  countAwaitingReview(): Promise<number> {
    return this.db.opportunity.count({
      where: { status: OpportunityStatus.PENDING_APPROVAL },
    })
  }

  async countBySector(window: Window): Promise<SectorTally[]> {
    const grouped = await this.db.opportunity.groupBy({
      by: ['sector'],
      where: { createdAt: { gte: window.from, lte: window.to } },
      _count: { _all: true },
    })

    return grouped
      .map(row => ({ sector: row.sector, opportunities: row._count._all }))
      .sort((a, b) => b.opportunities - a.opportunities)
  }

  /**
   * The day something happened is its start time, falling back to its deadline
   * and then to the day it was posted. That fallback cannot be expressed as a
   * column filter, so the kind and the place are narrowed in the query and the
   * period is applied to the rows that come back.
   */
  async listEvents(filter: ReportFilter): Promise<ActivityRow[]> {
    const opportunities = await this.db.opportunity.findMany({
      where: {
        ...(filter.mode ? { mode: filter.mode } : {}),
        ...(filter.sector ? { sector: filter.sector } : {}),
      },
      include: {
        creator: { select: { name: true, role: true } },
        _count: { select: { applications: true, checkins: true } },
        applications: { where: { status: ApplicationStatus.ACCEPTED }, select: { id: true } },
        taskSubmissions: { where: { status: SubmissionStatus.APPROVED }, select: { id: true } },
      },
    })

    return opportunities
      .map(opportunity => ({
        id: opportunity.id,
        title: opportunity.title,
        description: opportunity.description,
        sector: opportunity.sector,
        location: opportunity.location,
        mode: opportunity.mode,
        organiser: opportunity.creator.name,
        organiserRole: opportunity.creator.role,
        status: opportunity.status,
        postedAt: opportunity.createdAt,
        happenedAt: opportunity.startsAt ?? opportunity.endsAt ?? opportunity.createdAt,
        applications: opportunity._count.applications,
        accepted: opportunity.applications.length,
        checkedIn: opportunity._count.checkins,
        delivered: opportunity.taskSubmissions.length,
      }))
      .filter(
        row =>
          row.happenedAt.getTime() >= filter.from.getTime() &&
          row.happenedAt.getTime() <= filter.to.getTime(),
      )
      .sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime())
  }

  async listCheckins(filter: ReportFilter): Promise<AttendanceRow[]> {
    const checkins = await this.db.checkin.findMany({
      where: {
        checkinTime: { gte: filter.from, lte: filter.to },
        opportunity: {
          ...(filter.mode ? { mode: filter.mode } : {}),
          ...(filter.sector ? { sector: filter.sector } : {}),
        },
      },
      include: {
        volunteer: { select: { name: true } },
        opportunity: { select: { title: true, sector: true, mode: true } },
      },
      orderBy: { checkinTime: 'asc' },
    })

    return checkins.map(checkin => ({
      checkedInAt: checkin.checkinTime,
      checkedOutAt: checkin.checkoutTime,
      method: checkin.method,
      volunteerName: checkin.volunteer.name,
      opportunityTitle: checkin.opportunity.title,
      mode: checkin.opportunity.mode,
      sector: checkin.opportunity.sector,
    }))
  }
}
