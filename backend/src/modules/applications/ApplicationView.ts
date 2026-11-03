import type { ApplicationRecord } from './ApplicationStore'

export type ApplicationView = {
  id: string
  status: string
  motivationStatement: string
  resumeUrl: string | null
  createdAt: string
  volunteer: { id: string; name: string; email: string }
  opportunity: { id: string; title: string; applicationDeadline: string; mode: string }
}

export function toApplicationView(record: ApplicationRecord): ApplicationView {
  return {
    id: record.id,
    status: record.status,
    motivationStatement: record.motivationStatement,
    resumeUrl: record.resumeUrl,
    createdAt: record.createdAt.toISOString(),
    volunteer: record.volunteer,
    opportunity: {
      id: record.opportunity.id,
      title: record.opportunity.title,
      applicationDeadline: record.opportunity.applicationDeadline.toISOString(),
      mode: record.opportunity.mode,
    },
  }
}
