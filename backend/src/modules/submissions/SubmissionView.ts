import type { SubmissionRecord } from './SubmissionStore'

export type SubmissionView = {
  id: string
  status: string
  hoursClaimed: number
  proofUrl: string
  /** Why it was turned down. Null unless it was. */
  reviewNote: string | null
  createdAt: string
  volunteer: { id: string; name: string }
  opportunity: { id: string; title: string }
}

export function toSubmissionView(record: SubmissionRecord): SubmissionView {
  return {
    id: record.id,
    status: record.status,
    hoursClaimed: record.hoursClaimed,
    proofUrl: record.proofUrl,
    reviewNote: record.reviewNote,
    createdAt: record.createdAt.toISOString(),
    volunteer: record.volunteer,
    opportunity: { id: record.opportunity.id, title: record.opportunity.title },
  }
}
