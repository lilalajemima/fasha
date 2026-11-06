import type { OpportunityRecord } from './OpportunityStore'

export type OpportunityView = {
  id: string
  title: string
  description: string
  mode: string
  location: string | null
  sector: string | null
  maxCapacity: number
  applicationDeadline: string
  startsAt: string | null
  endsAt: string | null
  status: string
  reviewNote: string | null
  requiredSkills: string[]
  categories: string[]
  brief: { name: string; url: string } | null
  createdAt: string
  creator: { id: string; name: string; role: string }
  matchScore?: number
}

export function toView(record: OpportunityRecord, matchScore?: number): OpportunityView {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    mode: record.mode,
    location: record.location,
    sector: record.sector,
    maxCapacity: record.maxCapacity,
    applicationDeadline: record.applicationDeadline.toISOString(),
    startsAt: record.startsAt ? record.startsAt.toISOString() : null,
    endsAt: record.endsAt ? record.endsAt.toISOString() : null,
    status: record.status,
    reviewNote: record.reviewNote,
    requiredSkills: record.requiredSkills,
    categories: record.categories,
    // The name and where to fetch it; the PDF itself never rides in a list.
    brief: record.brief ? { name: record.brief.name, url: `/opportunities/${record.id}/brief` } : null,
    createdAt: record.createdAt.toISOString(),
    creator: record.creator,
    ...(matchScore === undefined ? {} : { matchScore }),
  }
}
