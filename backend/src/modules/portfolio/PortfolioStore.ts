import type { OpportunityMode, PortfolioEntry } from '@prisma/client'

export type PortfolioRecord = PortfolioEntry & {
  opportunity: {
    id: string
    title: string
    description: string
    mode: OpportunityMode
    creatorId: string
    requiredSkills: string[]
    categories: string[]
    startsAt: Date | null
    endsAt: Date | null
    creator: { name: string; role: string }
    brief: { name: string } | null
  }
}

/** An initiative this person proposed and ran, with how many people it reached. */
export type OrganisedRecord = {
  id: string
  title: string
  description: string
  mode: OpportunityMode
  sector: string | null
  location: string | null
  startsAt: Date | null
  endsAt: Date | null
  requiredSkills: string[]
  categories: string[]
  brief: { name: string } | null
  people: number
}

export interface PortfolioStore {
  findForVolunteer(volunteerId: string): Promise<PortfolioRecord[]>
  /** Initiatives this person proposed that were published and have since run. */
  findOrganisedBy(volunteerId: string): Promise<OrganisedRecord[]>
}
