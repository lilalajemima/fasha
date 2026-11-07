import type { OpportunityView } from './types'

/**
 * Month grid maths for the organiser calendar. It is deliberately free of
 * React so the awkward part, which is the day bucketing, can be reasoned
 * about on its own. Everything works in the browser's own timezone.
 */
export type MarkKind = 'HAPPENING' | 'DEADLINE'

export type CalendarMark = {
  id: string
  opportunityId: string
  title: string
  kind: MarkKind
  at: Date
  to: string
  mode: OpportunityView['mode']
  citizen: boolean
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

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const monthTitle = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' })

export function monthLabel(month: Date): string {
  return monthTitle.format(month)
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(month: Date, step: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + step, 1)
}

export function addDays(date: Date, step: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + step)
}

export function startOfWeek(date: Date): Date {
  return addDays(date, -((date.getDay() + 6) % 7))
}

export function weekLabel(start: Date): string {
  const end = addDays(start, 6)
  const sameMonth = start.getMonth() === end.getMonth()
  const first = new Intl.DateTimeFormat('en-GB', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' })

  return `${first.format(start)} to ${dayTitle.format(end)}`
}

const dayTitle = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const dayNameTitle = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

export function dayWithName(date: Date): string {
  return dayNameTitle.format(date)
}

export function inputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

export function fromInputValue(value: string): Date | null {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b)
}

export function marksOn(marks: CalendarMark[], date: Date): CalendarMark[] {
  return marks
    .filter(mark => isSameDay(mark.at, date))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
}

export function weekDays(date: Date, marks: CalendarMark[]): CalendarDay[] {
  const start = startOfWeek(date)
  const today = new Date()

  return Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
    const day = addDays(start, index)

    return {
      key: dayKey(day),
      date: day,
      dayOfMonth: day.getDate(),
      inMonth: true,
      isToday: isSameDay(day, today),
      marks: marksOn(marks, day),
    }
  })
}

/**
 * Where a calendar entry should take you: whatever is left to do on it.
 *
 * While applications are open, that is the applicants. Once the work is over
 * it is the proof — the register for work people turned up to, the
 * deliverables for work done remotely. Between the two, when nobody else can
 * apply but the day has not come, an event is waiting on its register and
 * remote work is still waiting on its people.
 */
export function destinationFor(item: OpportunityView, now = new Date()): string {
  const ends = item.endsAt ?? item.startsAt
  const over = ends !== null && Date.parse(ends) < now.getTime()
  const open = Date.parse(item.applicationDeadline) >= now.getTime()
  const applicants = `/manage/opportunities/${item.id}/applications`

  // Being over wins over the deadline: a date set oddly late cannot send you
  // back to the applicants of work that has already been done.
  if (over) {
    return item.mode === 'VIRTUAL'
      ? `/manage/review?opportunity=${item.id}`
      : `/manage/attendance?event=${item.id}`
  }

  if (open || item.mode === 'VIRTUAL') return applicants

  return `/manage/attendance?event=${item.id}`
}

/**
 * Two things are worth seeing on a calendar: the day the work happens, and the
 * day applications close. Virtual work has no start time, so its deliverable
 * deadline is what gets drawn as the happening.
 */
export function marksFrom(
  items: OpportunityView[],
  now = new Date(),
  linkFor: (item: OpportunityView, now: Date) => string = destinationFor,
): CalendarMark[] {
  const marks: CalendarMark[] = []

  for (const item of items) {
    const happensAt = item.startsAt ?? item.endsAt
    const to = linkFor(item, now)
    const shape = { mode: item.mode, citizen: item.creator.role === 'VOLUNTEER' }

    if (happensAt) {
      marks.push({
        id: `${item.id}:happening`,
        opportunityId: item.id,
        title: item.title,
        kind: 'HAPPENING',
        at: new Date(happensAt),
        to,
        ...shape,
      })
    }

    marks.push({
      id: `${item.id}:deadline`,
      opportunityId: item.id,
      title: item.title,
      kind: 'DEADLINE',
      at: new Date(item.applicationDeadline),
      to,
      ...shape,
    })
  }

  return marks
}

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
