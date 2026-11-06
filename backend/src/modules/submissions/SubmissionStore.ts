import type { SubmissionStatus, TaskSubmission } from '@prisma/client'

export type SubmissionRecord = TaskSubmission & {
  volunteer: { id: string; name: string }
  opportunity: { id: string; title: string; creatorId: string; requiredSkills: string[] }
}

export type NewSubmission = {
  hoursClaimed: number
  proofUrl: string
}

export interface SubmissionStore {
  create(
    opportunityId: string,
    volunteerId: string,
    input: NewSubmission,
  ): Promise<SubmissionRecord>
  findById(id: string): Promise<SubmissionRecord | null>
  findByVolunteer(volunteerId: string): Promise<SubmissionRecord[]>
  findForOpportunity(opportunityId: string): Promise<SubmissionRecord[]>
  /** Everything sent in to any opportunity this person runs. */
  findForCreator(creatorId: string): Promise<SubmissionRecord[]>
  findOpen(opportunityId: string, volunteerId: string): Promise<SubmissionRecord | null>
  reject(id: string, reviewNote: string): Promise<SubmissionRecord>
  approveAndCredit(id: string, hours: number, skills: string[]): Promise<SubmissionRecord>
}

export type { SubmissionStatus }
