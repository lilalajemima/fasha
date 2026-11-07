import type { OrganisedRecord, PortfolioRecord } from './PortfolioStore'

export type PortfolioEntryView = {
  id: string
  hours: number
  skills: string[]
  creditedOn: string
  opportunity: {
    id: string
    title: string
    description: string
    mode: string
    organiser: string
    requiredSkills: string[]
    categories: string[]
    brief: { name: string; url: string } | null
  }
}

export type OrganisedView = {
  id: string
  title: string
  description: string
  mode: string
  sector: string | null
  location: string | null
  happenedOn: string | null
  requiredSkills: string[]
  categories: string[]
  people: number
  brief: { name: string; url: string } | null
}

export type PortfolioVolunteer = {
  name: string
  portfolioSlug: string
  avatar: string | null
  bio: string | null
  skills: string[]
  interests: string[]
  availabilitySlots: string[]
}

export type PortfolioView = {
  volunteer: PortfolioVolunteer
  totals: { hours: number; opportunities: number; organised: number; skills: string[] }
  entries: PortfolioEntryView[]
  organised: OrganisedView[]
}

function briefOf(id: string, brief: { name: string } | null) {
  return brief ? { name: brief.name, url: `/opportunities/${id}/brief` } : null
}

function toEntry(record: PortfolioRecord): PortfolioEntryView {
  return {
    id: record.id,
    hours: record.hoursCredited,
    skills: record.skillsCredited,
    creditedOn: record.dateCredited.toISOString(),
    opportunity: {
      id: record.opportunity.id,
      title: record.opportunity.title,
      description: record.opportunity.description,
      mode: record.opportunity.mode,
      organiser: record.opportunity.creator.name,
      requiredSkills: record.opportunity.requiredSkills,
      categories: record.opportunity.categories,
      brief: briefOf(record.opportunity.id, record.opportunity.brief),
    },
  }
}

function toOrganised(record: OrganisedRecord): OrganisedView {
  return {
    id: record.id,
    title: record.title,
    description: record.description,
    mode: record.mode,
    sector: record.sector,
    location: record.location,
    happenedOn: (record.endsAt ?? record.startsAt)?.toISOString() ?? null,
    requiredSkills: record.requiredSkills,
    categories: record.categories,
    people: record.people,
    brief: briefOf(record.id, record.brief),
  }
}

/**
 * Hours are only ever counted when somebody else verified them, so an
 * initiative the owner ran themselves is reported as organised rather than as
 * credited time. The two lists are kept apart for the same reason: one is
 * other people's word for what you did, the other is your own.
 */
export function toPortfolioView(
  volunteer: PortfolioVolunteer,
  records: PortfolioRecord[],
  organised: OrganisedRecord[],
): PortfolioView {
  const joined = records.filter(record => record.opportunity.creatorId !== null)
  const hours = joined.reduce((total, record) => total + record.hoursCredited, 0)
  const opportunities = new Set(joined.map(record => record.opportunityId))
  const skills = new Set(joined.flatMap(record => record.skillsCredited))

  return {
    volunteer,
    totals: {
      hours: Math.round(hours * 100) / 100,
      opportunities: opportunities.size,
      organised: organised.length,
      skills: [...skills].sort(),
    },
    entries: records.map(toEntry),
    organised: organised.map(toOrganised),
  }
}
