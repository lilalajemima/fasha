import type { OpportunityRecord } from './OpportunityStore'

export type OpportunityView = {
  id: string
  title: string
  description: string
  mode: string
  location: string | null
  maxCapacity: number
  applicationDeadline: string
  status: string
  requiredSkills: string[]
  categories: string[]
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
    maxCapacity: record.maxCapacity,
    applicationDeadline: record.applicationDeadline.toISOString(),
    status: record.status,
    requiredSkills: record.requiredSkills,
    categories: record.categories,
    createdAt: record.createdAt.toISOString(),
    creator: record.creator,
    ...(matchScore === undefined ? {} : { matchScore }),
  }
}
