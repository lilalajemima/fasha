const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const weekdayShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short' })
const fullDate = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

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

export function quantity(amount: number, one: string, many = `${one}s`): string {
  return `${amount} ${amount === 1 ? one : many}`
}

export function meta(...parts: (string | null | undefined | false)[]): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(' · ')
}

export function whenLabel(startsAt: string | null, endsAt: string | null): string | null {
  if (startsAt && endsAt) {
    return `${longDate(startsAt)}, ${timeOfDay(startsAt)} to ${timeOfDay(endsAt)}`
  }

  if (startsAt) return longDate(startsAt)
  if (endsAt) return `Due by ${longDate(endsAt)}`

  return null
}

export function dayBlock(iso: string): { weekday: string; date: string } {
  const when = new Date(iso)

  return { weekday: weekdayShort.format(when), date: dayMonth.format(when) }
}
