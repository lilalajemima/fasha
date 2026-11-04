import type { Opportunity, OpportunityMode, OpportunityStatus, UserRole, ActivityCount } from '@prisma/client'

export type OpportunityRecord = Opportunity & {
  creator: { id: string; name: string; role: UserRole }
}

export type NewOpportunity = {
  title: string
  description: string
  mode: OpportunityMode
  location: string | null
  sector: string
  maxCapacity: number
  applicationDeadline: Date
  startsAt: Date | null
  endsAt: Date
  requiredSkills: string[]
  categories: string[]
}

export type FeedFilter = {
  search: string | null
  mode: OpportunityMode | null
  sector: string | null
}

/**
 * How much is waiting on the organiser for one opportunity. Counted in the
 * database rather than by loading every application into memory.
 */
export type WorkloadRow = {
  opportunityId: string
  pendingApplications: number
  acceptedApplications: number
  pendingDeliverables: number
}

/** What other people have attached to an opportunity, which is what decides
 *  whether it can still be deleted. */
export type ActivityCount = {
  applications: number
  deliverables: number
  credited: number
}

export interface OpportunityStore {
  create(
    creatorId: string,
    status: OpportunityStatus,
    input: NewOpportunity,
  ): Promise<OpportunityRecord>
  findPublished(filter: FeedFilter): Promise<OpportunityRecord[]>
  findById(id: string): Promise<OpportunityRecord | null>
  findCreatedBy(creatorId: string): Promise<OpportunityRecord[]>
  countWorkload(creatorId: string): Promise<WorkloadRow[]>
  countActivity(id: string): Promise<ActivityCount>
  findAwaitingApproval(): Promise<OpportunityRecord[]>
  update(
    id: string,
    input: NewOpportunity,
    status: OpportunityStatus,
  ): Promise<OpportunityRecord>
  updateStatus(
    id: string,
    status: OpportunityStatus,
    reviewNote: string | null,
  ): Promise<OpportunityRecord>
  closeApplications(id: string, at: Date): Promise<OpportunityRecord>
  remove(id: string): Promise<void>
  setQrToken(id: string, qrToken: string): Promise<void>
}