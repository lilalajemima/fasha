/**
 * Umuganda is the last Saturday of the month, the morning most of the country
 * is already out working. It moves, so it is worked out rather than listed,
 * and the calendar marks the day it falls on.
 */
const SATURDAY = 6

function lastSaturdayOf(year: number, month: number): Date {
  const last = new Date(year, month + 1, 0)
  const back = (last.getDay() - SATURDAY + 7) % 7

  return new Date(year, month + 1, 0 - back)
}

export function isUmuganda(date: Date): boolean {
  const last = lastSaturdayOf(date.getFullYear(), date.getMonth())

  return (
    date.getDate() === last.getDate() &&
    date.getMonth() === last.getMonth() &&
    date.getFullYear() === last.getFullYear()
  )
}
