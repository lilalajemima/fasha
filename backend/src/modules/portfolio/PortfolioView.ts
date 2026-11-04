import type { PortfolioRecord } from './PortfolioStore'

export type PortfolioEntryView = {
  id: string
  hours: number
  skills: string[]
  creditedOn: string
  opportunity: { id: string; title: string; mode: string }
}

export type PortfolioView = {
  volunteer: { name: string; portfolioSlug: string }
  totals: { hours: number; opportunities: number; organised: number; skills: string[] }
  entries: PortfolioEntryView[]
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
      mode: record.opportunity.mode,
    },
  }
}

/**
 * Hours are only ever counted when somebody else verified them, so an
 * initiative the owner ran themselves is reported as organised rather than as
 * credited time.
 */
export function toPortfolioView(
  volunteer: { name: string; portfolioSlug: string },
  records: PortfolioRecord[],
  organised: number,
): PortfolioView {
  const hours = records.reduce((total, record) => total + record.hoursCredited, 0)
  const opportunities = new Set(records.map(record => record.opportunityId))
  const skills = new Set(records.flatMap(record => record.skillsCredited))

  return {
    volunteer,
    totals: {
      hours: Math.round(hours * 100) / 100,
      opportunities: opportunities.size,
      organised,
      skills: [...skills].sort(),
    },
    entries: records.map(toEntry),
  }
}