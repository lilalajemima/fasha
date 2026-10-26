import type { OpportunityMode, PortfolioEntry } from '@prisma/client'

export type PortfolioRecord = PortfolioEntry & {
  opportunity: { id: string; title: string; mode: OpportunityMode }
}

export interface PortfolioStore {
  findForVolunteer(volunteerId: string): Promise<PortfolioRecord[]>
}
