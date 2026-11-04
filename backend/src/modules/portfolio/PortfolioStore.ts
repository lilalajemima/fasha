import type { OpportunityMode, PortfolioEntry } from '@prisma/client'

export type PortfolioRecord = PortfolioEntry & {
  opportunity: { id: string; title: string; mode: OpportunityMode; creatorId: string }
}

export interface PortfolioStore {
  findForVolunteer(volunteerId: string): Promise<PortfolioRecord[]>
  /** Initiatives this person proposed that were published and have since run. */
  countOrganised(volunteerId: string): Promise<number>
}