import type { Opportunity, OpportunityMode, OpportunityStatus, UserRole } from '@prisma/client'

export type OpportunityRecord = Opportunity & {
  creator: { id: string; name: string; role: UserRole }
}

export type NewOpportunity = {
  title: string
  description: string
  mode: OpportunityMode
  location: string | null
  maxCapacity: number
  applicationDeadline: Date
  requiredSkills: string[]
  categories: string[]
}

export type FeedFilter = {
  search: string | null
  mode: OpportunityMode | null
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
  findAwaitingApproval(): Promise<OpportunityRecord[]>
  updateStatus(id: string, status: OpportunityStatus): Promise<OpportunityRecord>
  setQrToken(id: string, qrToken: string): Promise<void>
}
