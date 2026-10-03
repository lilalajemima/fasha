import {
  attendees, deliverables, myApplications, myPortfolio, myProfile, myTask, opportunities, reviewApplications,
} from './data'
import type { Opportunity } from './types'

/**
 * One place for every read the screens make. Each function is swapped for a
 * fetch() call to the Express API in the integration sprint; the screens stay the same.
 */

/** Weighted Jaccard compatibility: skills count 0.65, interests 0.35 */
export function matchScore(userSkills: string[], userInterests: string[], tags: string[]) {
  const jaccard = (a: string[], b: string[]) => {
    const left = new Set(a.map(v => v.toLowerCase()))
    const right = new Set(b.map(v => v.toLowerCase()))
    const union = new Set([...left, ...right])
    if (union.size === 0) return 0
    let shared = 0
    left.forEach(value => { if (right.has(value)) shared += 1 })
    return shared / union.size
  }
  const score = 0.65 * jaccard(userSkills, tags) + 0.35 * jaccard(userInterests, tags)
  return Math.round(score * 100)
}

export const isOpen = (o: Opportunity) =>
  o.status === 'PUBLISHED' && o.filled < o.capacity

export async function getFeed() {
  const open = opportunities.filter(o => o.status === 'PUBLISHED')
  return open
    .map(o => ({ ...o, match: matchScore(myProfile.skills, myProfile.interests, o.tags) }))
    .sort((a, b) => Number(isOpen(b)) - Number(isOpen(a)) || b.match - a.match)
}

export async function getOpportunity(id: string) {
  const found = opportunities.find(o => o.id === id)
  if (!found) return undefined
  return { ...found, match: matchScore(myProfile.skills, myProfile.interests, found.tags) }
}

export async function getMyInitiatives() {
  return opportunities.filter(o => o.citizenLed)
}

export async function getOrgOpportunities() { return opportunities }
export async function getProfile() { return myProfile }
export async function getApplications() { return myApplications }
export async function getVirtualTask() { return myTask }
export async function getPortfolio() { return myPortfolio }
export async function getAttendees() { return attendees }
export async function getReviewApplications() { return reviewApplications }
export async function getDeliverables() { return deliverables }
