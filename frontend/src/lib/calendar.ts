import type { OpportunityView } from './types'

/**
 * Month grid maths for the organiser calendar. It is deliberately free of React
 * so the awkward part, which is the day bucketing, can be reasoned about on its
 * own. Everything works in the browser's own timezone.
 */

export type MarkKind = 'HAPPENING' | 'DEADLINE'

export type CalendarMark = {
  id: string
  opportunityId: string
  title: string
  kind: MarkKind
  at: Date
}

export type CalendarDay = {
  key: string
  date: Date
  dayOfMonth: number
  inMonth: boolean
  isToday: boolean
  marks: CalendarMark[]
}

const DAYS_IN_WEEK = 7
const WEEKS_SHOWN = 6

/** Monday first, which is how a Rwandan week is read. */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const monthTitle = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })

export function monthLabel(month: Date): string {
  return monthTitle.format(month)
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(month: Date, step: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + step, 1)
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

/**
 * Two things are worth seeing on a calendar: the day the work happens, and the
 * day applications close. Virtual work has no start time, so its deliverable
 * deadline is what gets drawn as the happening.
 */
export function marksFrom(items: OpportunityView[]): CalendarMark[] {
  const marks: CalendarMark[] = []

  for (const item of items) {
    const happensAt = item.startsAt ?? item.endsAt

    if (happensAt) {
      marks.push({
        id: `${item.id}:happening`,
        opportunityId: item.id,
        title: item.title,
        kind: 'HAPPENING',
        at: new Date(happensAt),
      })
    }

    marks.push({
      id: `${item.id}:deadline`,
      opportunityId: item.id,
      title: item.title,
      kind: 'DEADLINE',
      at: new Date(item.applicationDeadline),
    })
  }

  return marks
}

/**
 * Always six weeks, so the grid does not change height as the months turn.
 * Marks are bucketed once into a map, then each cell is a single lookup.
 */
export function monthGrid(month: Date, marks: CalendarMark[]): CalendarDay[] {
  const byDay = new Map<string, CalendarMark[]>()

  for (const mark of marks) {
    const key = dayKey(mark.at)
    const bucket = byDay.get(key)

    if (bucket) {
      bucket.push(mark)
    } else {
      byDay.set(key, [mark])
    }
  }

  const first = startOfMonth(month)
  const offset = (first.getDay() + 6) % 7
  const todayKey = dayKey(new Date())
  const days: CalendarDay[] = []

  for (let index = 0; index < DAYS_IN_WEEK * WEEKS_SHOWN; index += 1) {
    const date = new Date(first.getFullYear(), first.getMonth(), 1 - offset + index)
    const key = dayKey(date)
    const marksToday = [...(byDay.get(key) ?? [])].sort((a, b) => a.at.getTime() - b.at.getTime())

    days.push({
      key,
      date,
      dayOfMonth: date.getDate(),
      inMonth: date.getMonth() === first.getMonth(),
      isToday: key === todayKey,
      marks: marksToday,
    })
  }

  return days
}
