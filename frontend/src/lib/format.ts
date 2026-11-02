const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const fullDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

export function shortDate(iso: string): string {
  return dayMonth.format(new Date(iso))
}

export function longDate(iso: string): string {
  return fullDate.format(new Date(iso))
}

export function timeOfDay(iso: string): string {
  return clock.format(new Date(iso))
}

export function dateAndTime(iso: string): string {
  return `${longDate(iso)} · ${timeOfDay(iso)}`
}

export function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

export function hasPassed(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now()
}

export function sentenceCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ')
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function whenLabel(startsAt: string | null, endsAt: string | null): string {
  if (startsAt && endsAt) {
    return `${longDate(startsAt)}, ${timeOfDay(startsAt)} to ${timeOfDay(endsAt)}`
  }

  if (endsAt) return `Due by ${longDate(endsAt)}`

  return 'Date to be confirmed'
}
