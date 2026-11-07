import { useGet } from './useGet'

// The lists the server matches on. They are fetched rather than copied into
// the client, so a form can never offer a tag the server would refuse.
export type Catalogue = {
  interests: string[]
  skills: string[]
  sectors: string[]
  availability: { days: string[]; parts: string[]; slots: string[] }
}

export const DAY_LABELS: Record<string, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
}

export const DAY_NAMES: Record<string, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
}

export const PART_LABELS: Record<string, string> = {
  MORNING: 'Morning',
  AFTERNOON: 'Afternoon',
  EVENING: 'Evening',
}

export const WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
export const PARTS = ['MORNING', 'AFTERNOON', 'EVENING']

export function slotOf(day: string, part: string): string {
  return `${day}_${part}`
}

export function availabilityByDay(slots: string[]): { day: string; parts: string[] }[] {
  return WEEK.map(day => ({
    day,
    parts: PARTS.filter(part => slots.includes(slotOf(day, part))),
  })).filter(entry => entry.parts.length > 0)
}

export function availabilityLine(slots: string[]): string {
  const days = availabilityByDay(slots)

  if (days.length === 0) return 'Availability not set'

  return days
    .map(entry => `${DAY_LABELS[entry.day]} ${entry.parts.map(part => PART_LABELS[part].toLowerCase()).join(', ')}`)
    .join(' · ')
}

export function useCatalogue() {
  return useGet<Catalogue>('/catalogue')
}
