/**
 * The first-time guide: a handful of steps, each on its own page, each
 * pointing at the thing it talks about. `targets` is tried in order and the
 * first one on the page wins, so a step still has something to show a brand
 * new account that has no opportunities or events yet.
 */
export type TourStep = {
  route: string
  targets: string[]
  title: string
  body: string
  next?: string
}

const PREFIX = 'fasha.tour.'
const DONE = 'done'

/**
 * Where to pick up for this person, or null if they have finished or skipped.
 * Kept per account rather than per browser tab, and deliberately left alone on
 * sign out: a guide you dismissed should stay dismissed the next time you sign
 * in, while somebody else signing in on the same phone still gets theirs.
 */
export function tourStart(userId: string, length: number): number | null {
  try {
    const saved = localStorage.getItem(PREFIX + userId)

    if (saved === DONE) return null

    const step = Number(saved)

    return Number.isInteger(step) && step >= 0 && step < length ? step : 0
  } catch {
    return null
  }
}

export function tourSave(userId: string, step: number): boolean {
  try {
    localStorage.setItem(PREFIX + userId, String(step))

    return true
  } catch {
    return false
  }
}

export function tourFinish(userId: string): boolean {
  try {
    localStorage.setItem(PREFIX + userId, DONE)

    return true
  } catch {
    return false
  }
}
