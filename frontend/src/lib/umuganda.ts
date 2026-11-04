/**
 * Umuganda is the last Saturday of the month, the morning most of the country
 * is already out working. The sidebar prints the next one, so the app agrees
 * with the calendar people actually keep.
 */

const SATURDAY = 6

const label = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

function lastSaturdayOf(year: number, month: number): Date {
  const last = new Date(year, month + 1, 0)
  const back = (last.getDay() - SATURDAY + 7) % 7

  return new Date(year, month + 1, 0 - back)
}

/** The next one, counting today as still to come until the day is over. */
export function nextUmuganda(now: Date = new Date()): Date {
  const thisMonth = lastSaturdayOf(now.getFullYear(), now.getMonth())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (thisMonth.getTime() >= today.getTime()) return thisMonth

  return lastSaturdayOf(now.getFullYear(), now.getMonth() + 1)
}

export function nextUmugandaLabel(now: Date = new Date()): string {
  return label.format(nextUmuganda(now))
}

/** True for the day Umuganda falls on, which the calendar marks. */
export function isUmuganda(date: Date): boolean {
  const last = lastSaturdayOf(date.getFullYear(), date.getMonth())

  return (
    date.getDate() === last.getDate() &&
    date.getMonth() === last.getMonth() &&
    date.getFullYear() === last.getFullYear()
  )
}
