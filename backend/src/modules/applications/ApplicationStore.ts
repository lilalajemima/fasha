import type { Application, ApplicationStatus } from '@prisma/client'

export type ApplicationRecord = Application & {
  volunteer: { id: string; name: string; email: string }
  opportunity: {
    id: string
    title: string
    creatorId: string
    maxCapacity: number
    applicationDeadline: Date
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
  acceptIfSpace(
    applicationId: string,
    opportunityId: string,
    maxCapacity: number,
  ): Promise<ApplicationRecord | null>
  updateStatus(id: string, status: ApplicationStatus): Promise<ApplicationRecord>
}
