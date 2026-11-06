import type { Application, ApplicationStatus, OpportunityMode } from '@prisma/client'

export type ApplicationRecord = Application & {
  volunteer: {
    id: string
    name: string
    email: string
    avatar: string | null
    bio: string | null
    /** Null for an account with no volunteer profile, which cannot apply. */
    profile: {
      portfolioSlug: string
      skills: string[]
      interests: string[]
      availabilitySlots: string[]
      location: string | null
    } | null
  }
  opportunity: {
    id: string
    title: string
    creatorId: string
    maxCapacity: number
    applicationDeadline: Date
    mode: OpportunityMode
    requiredSkills: string[]
    categories: string[]
  }
}

export type NewApplication = {
  motivationStatement: string
  resumeUrl: string | null
}

export interface ApplicationStore {
  create(
    opportunityId: string,
    volunteerId: string,
    input: NewApplication,
  ): Promise<ApplicationRecord>
  findById(id: string): Promise<ApplicationRecord | null>
  findByVolunteer(volunteerId: string): Promise<ApplicationRecord[]>
  findForOpportunity(opportunityId: string): Promise<ApplicationRecord[]>
  findAccepted(opportunityId: string, volunteerId: string): Promise<ApplicationRecord | null>
  acceptIfSpace(
    applicationId: string,
    opportunityId: string,
    maxCapacity: number,
  ): Promise<ApplicationRecord | null>
  updateStatus(id: string, status: ApplicationStatus): Promise<ApplicationRecord>
}
