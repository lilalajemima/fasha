import type { Checkin, CheckInMethod } from '@prisma/client'

export type CheckinRecord = Checkin & {
  volunteer: { id: string; name: string }
  opportunity: {
    id: string
    title: string
    creatorId: string
    requiredSkills: string[]
    qrToken: string | null
  }
}

export interface CheckinStore {
  create(
    opportunityId: string,
    volunteerId: string,
    method: CheckInMethod,
  ): Promise<CheckinRecord>
  findById(id: string): Promise<CheckinRecord | null>
  findForOpportunity(opportunityId: string): Promise<CheckinRecord[]>
  findOne(opportunityId: string, volunteerId: string): Promise<CheckinRecord | null>
  checkOutAndCredit(
    id: string,
    leftAt: Date,
    hours: number,
    skills: string[],
  ): Promise<CheckinRecord>
}
