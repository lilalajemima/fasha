import {
  ApplicationStatus,
  CheckInMethod,
  OpportunityStatus,
  type PrismaClient,
  UserRole,
} from '@prisma/client'
import { BaseRepository } from '../../core/database/BaseRepository'
import { prisma } from '../../core/database/prisma'
import type {
  ActivityRow,
  AdminStore,
  AttendanceRow,
  AttendanceTally,
  InitiativeTally,
  RoleTally,
  SectorTally,
} from './AdminStore'

export class AdminRepository extends BaseRepository implements AdminStore {
  constructor(db: PrismaClient = prisma) {
    super(db)
  }

  async countRoles(): Promise<RoleTally> {
    const [volunteers, organisations] = await Promise.all([
      this.db.user.count({ where: { role: UserRole.VOLUNTEER } }),
      this.db.user.count({ where: { role: UserRole.ORGANISATION } }),
    ])

    return { volunteers, organisations }
  }

  async countInitiatives(): Promise<InitiativeTally> {
    const byVolunteer = { creator: { role: UserRole.VOLUNTEER } }

    const [published, citizenProposed, citizenApproved, citizenRejected, awaitingReview] =
      await Promise.all([
        this.db.opportunity.count({ where: { status: OpportunityStatus.PUBLISHED } }),
        this.db.opportunity.count({ where: byVolunteer }),
        this.db.opportunity.count({
          where: { ...byVolunteer, status: OpportunityStatus.PUBLISHED },
        }),
        this.db.opportunity.count({
          where: { ...byVolunteer, status: OpportunityStatus.REJECTED },
        }),
        this.db.opportunity.count({
          where: { ...byVolunteer, status: OpportunityStatus.PENDING_APPROVAL },
        }),
      ])

    return { published, citizenProposed, citizenApproved, citizenRejected, awaitingReview }
  }

  async countAttendance(): Promise<AttendanceTally> {
    const [acceptedPlaces, checkedIn, scanned, hours] = await Promise.all([
      this.db.application.count({ where: { status: ApplicationStatus.ACCEPTED } }),
      this.db.checkin.count(),
      this.db.checkin.count({ where: { method: CheckInMethod.QR } }),
      this.db.portfolioEntry.aggregate({ _sum: { hoursCredited: true } }),
    ])

    return {
      acceptedPlaces,
      checkedIn,
      scanned,
      byHand: checkedIn - scanned,
      hoursCredited: Math.round((hours._sum.hoursCredited ?? 0) * 100) / 100,
    }
  }

  async countBySector(): Promise<SectorTally[]> {
    const grouped = await this.db.opportunity.groupBy({
      by: ['sector'],
      _count: { _all: true },
    })

    return grouped
      .map(row => ({ sector: row.sector ?? 'Not set', opportunities: row._count._all }))
      .sort((a, b) => b.opportunities - a.opportunities)
  }

  async listActivity(): Promise<ActivityRow[]> {
    const opportunities = await this.db.opportunity.findMany({
      include: {
        creator: { select: { name: true, role: true } },
        _count: {
          select: {
            applications: true,
            checkins: true,
          },
        },
        applications: {
          where: { status: ApplicationStatus.ACCEPTED },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return opportunities.map(opportunity => ({
      id: opportunity.id,
      title: opportunity.title,
      sector: opportunity.sector,
      organiser: opportunity.creator.name,
      organiserRole: opportunity.creator.role,
      status: opportunity.status,
      applications: opportunity._count.applications,
      accepted: opportunity.applications.length,
      checkedIn: opportunity._count.checkins,
    }))
  }

  async listAttendance(from: Date, to: Date): Promise<AttendanceRow[]> {
    const checkins = await this.db.checkin.findMany({
      where: { checkinTime: { gte: from, lte: to } },
      include: {
        volunteer: { select: { name: true } },
        opportunity: { select: { title: true, sector: true } },
      },
      orderBy: { checkinTime: 'asc' },
    })

    return checkins.map(checkin => ({
      checkedInAt: checkin.checkinTime,
      checkedOutAt: checkin.checkoutTime,
      method: checkin.method,
      volunteerName: checkin.volunteer.name,
      opportunityTitle: checkin.opportunity.title,
      sector: checkin.opportunity.sector,
    }))
  }
}
