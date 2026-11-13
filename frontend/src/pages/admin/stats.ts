import type { ActivityRow, OpportunityView } from '../../lib/types'

/** Inclusive calendar days, as the date inputs give them: YYYY-MM-DD. */
export type Span = { from: string; to: string }

export type Decision = 'waiting' | 'approved' | 'rejected'

export type InterestCount = { name: string; count: number; share: number }

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Local midnight, never UTC, for the same reason filters.tsx gives: in Kigali
// a UTC conversion lands on the day before.
function dateOf(day: string): Date {
  const [year, month, date] = day.split('-').map(Number)

  return new Date(year, month - 1, date)
}

function dayOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * What a report needs to know about the moment it was made. Called from the
 * click that starts the report, never while rendering, so the page stays pure.
 */
export function stamp(): { day: string; label: string } {
  const now = new Date()

  return { day: dayOf(now), label: `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}` }
}

export function within(day: string, span: Span): boolean {
  if (span.from !== '' && day < span.from) return false
  if (span.to !== '' && day > span.to) return false

  return true
}

/**
 * The stretch to compare against. "This month" is set against the same days
 * of last month, because 1 to 14 November against 1 to 14 October is the
 * comparison people mean. Any other period is set against the same number of
 * days immediately before it. All time has nothing before it.
 */
export function previousSpan(span: Span, preset: string): Span | null {
  if (span.from === '' || span.to === '') return null

  const start = dateOf(span.from)
  const end = dateOf(span.to)

  if (preset === 'month') {
    const back = (date: Date) => {
      const moved = new Date(date.getFullYear(), date.getMonth() - 1, 1)
      const last = new Date(moved.getFullYear(), moved.getMonth() + 1, 0).getDate()

      moved.setDate(Math.min(date.getDate(), last))

      return moved
    }

    return { from: dayOf(back(start)), to: dayOf(back(end)) }
  }

  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  const before = new Date(start)

  before.setDate(before.getDate() - 1)

  const first = new Date(before)

  first.setDate(first.getDate() - (days - 1))

  return { from: dayOf(first), to: dayOf(before) }
}

/** "1–14 Oct", "18 Sep – 16 Oct", or with years when they differ. */
export function spanLabel(span: Span): string {
  const a = dateOf(span.from)
  const b = dateOf(span.to)
  const sameYear = a.getFullYear() === b.getFullYear()
  const year = (date: Date) => (sameYear ? '' : ` ${date.getFullYear()}`)

  if (sameYear && a.getMonth() === b.getMonth()) {
    return a.getDate() === b.getDate()
      ? `${a.getDate()} ${MONTHS[a.getMonth()]}`
      : `${a.getDate()}–${b.getDate()} ${MONTHS[a.getMonth()]}`
  }

  return `${a.getDate()} ${MONTHS[a.getMonth()]}${year(a)} – ${b.getDate()} ${MONTHS[b.getMonth()]}${year(b)}`
}

/**
 * How many of the items carry each interest, most common first. An item
 * tagged with three interests counts once towards each, so the shares can add
 * up to more than a hundred: each one is "of these opportunities, how many
 * were about this", which is the question being asked.
 */
export function topInterests(lists: string[][], limit = 3): { top: InterestCount[]; others: number } {
  const counts = new Map<string, number>()

  for (const list of lists) {
    for (const name of new Set(list)) counts.set(name, (counts.get(name) ?? 0) + 1)
  }

  const ranked = [...counts.entries()]
    .map(([name, count]) => ({ name, count, share: lists.length === 0 ? 0 : count / lists.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  return { top: ranked.slice(0, limit), others: Math.max(0, ranked.length - limit) }
}

/** "In 1–14 Nov" or, with nothing chosen, the twelve months the server sends. */
export function periodPhrase(span: Span): string {
  return span.from === '' || span.to === '' ? 'Over the last 12 months' : `In ${spanLabel(span)}`
}

/** ", 12 more than 1–14 Oct", or nothing when there is no earlier period. */
export function comparePhrase(now: number, before: number | null, against: string | null): string {
  if (before === null || against === null) return ''

  const difference = now - before

  if (difference === 0) return `, the same as ${against}`

  return `, ${Math.abs(difference)} ${difference > 0 ? 'more' : 'fewer'} than ${against}`
}

/** " Healthcare was the most common interest, followed by Education and Sport." */
export function interestPhrase(top: InterestCount[]): string {
  if (top.length === 0) return ''

  const [first, ...rest] = top.map(entry => entry.name)
  const tail = rest.length === 0 ? '' : `, followed by ${rest.join(' and ')}`

  return ` ${first} was the most common interest${tail}.`
}

export type ActivityTally = {
  opportunities: number
  applied: number
  accepted: number
  tookPart: number
  turnout: number | null
}

/** Turning up counts for events and an accepted piece of work for virtual ones. */
export function tallyActivity(rows: ActivityRow[]): ActivityTally {
  const applied = rows.reduce((sum, row) => sum + row.applications, 0)
  const accepted = rows.reduce((sum, row) => sum + row.accepted, 0)
  const tookPart = rows.reduce(
    (sum, row) => sum + (row.mode === 'VIRTUAL' ? row.delivered : row.checkedIn),
    0,
  )

  return {
    opportunities: rows.length,
    applied,
    accepted,
    tookPart,
    turnout: accepted === 0 ? null : Math.round((tookPart / accepted) * 100),
  }
}

/**
 * Only citizen initiatives go through review: organisations and the admin
 * publish straight away, so their opportunities were never approved by anyone
 * and do not belong in this history.
 */
export function decisionOf(item: OpportunityView): Decision | null {
  if (item.creator.role !== 'VOLUNTEER') return null
  if (item.status === 'PENDING_APPROVAL') return 'waiting'
  if (item.status === 'REJECTED') return 'rejected'

  return 'approved'
}

export type ApprovalTally = {
  submitted: number
  approved: number
  rejected: number
  waiting: number
  rate: number | null
}

export function tallyApprovals(items: OpportunityView[]): ApprovalTally {
  const decisions = items.map(decisionOf)
  const approved = decisions.filter(decision => decision === 'approved').length
  const rejected = decisions.filter(decision => decision === 'rejected').length

  return {
    submitted: decisions.filter(decision => decision !== null).length,
    approved,
    rejected,
    waiting: decisions.filter(decision => decision === 'waiting').length,
    rate: approved + rejected === 0 ? null : Math.round((approved / (approved + rejected)) * 100),
  }
}
