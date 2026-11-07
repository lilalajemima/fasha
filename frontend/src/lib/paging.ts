export const PER_PAGE = 8

export function pageCount(total: number, perPage: number = PER_PAGE): number {
  return Math.max(1, Math.ceil(total / perPage))
}

export function pageSlice<T>(items: T[], page: number, perPage: number = PER_PAGE): T[] {
  const start = (page - 1) * perPage

  return items.slice(start, start + perPage)
}

export type PageStep = number | 'gap'

export function pageNumbers(current: number, total: number): PageStep[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_unused, index) => index + 1)
  }

  const keep = new Set([1, total, current - 1, current, current + 1])
  const steps: PageStep[] = []
  let previous = 0

  for (let page = 1; page <= total; page += 1) {
    if (!keep.has(page)) continue
    if (previous > 0 && page - previous > 1) steps.push('gap')

    steps.push(page)
    previous = page
  }

  return steps
}
