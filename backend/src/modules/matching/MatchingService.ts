export type VolunteerTags = {
  skills: string[]
  interests: string[]
}

export type OpportunityTags = {
  requiredSkills: string[]
  categories: string[]
}

/**
 * How well a volunteer and an opportunity suit each other, as a percentage.
 *
 * Skills count for more than interests, 0.65 against 0.35, because a skill is
 * something the work actually needs while an interest only says somebody would
 * enjoy it.
 *
 * Jaccard rather than a count of shared tags: counting rewards whoever ticks
 * the most boxes, since another tag can only ever help them. Dividing by the
 * union means claiming a skill the work does not need costs you something, so
 * the number says these two fit rather than this person listed a lot.
 */
export class MatchingService {
  private readonly skillWeight = 0.65
  private readonly interestWeight = 0.35

  score(volunteer: VolunteerTags, opportunity: OpportunityTags): number {
    const skillOverlap = this.jaccard(volunteer.skills, opportunity.requiredSkills)
    const interestOverlap = this.jaccard(volunteer.interests, opportunity.categories)
    const weighted = this.skillWeight * skillOverlap + this.interestWeight * interestOverlap

    return Math.round(weighted * 100)
  }

  rank<T extends OpportunityTags>(volunteer: VolunteerTags, opportunities: T[]) {
    return opportunities
      .map(opportunity => ({ opportunity, score: this.score(volunteer, opportunity) }))
      .sort((a, b) => b.score - a.score)
  }

  private jaccard(first: string[], second: string[]): number {
    const left = this.normalise(first)
    const right = this.normalise(second)

    // Nothing on either side is not a perfect match, it is no information at
    // all. Returning 1 here would float every empty profile to the top.
    if (left.size === 0 && right.size === 0) {
      return 0
    }

    let shared = 0
    for (const tag of left) {
      if (right.has(tag)) {
        shared += 1
      }
    }

    const unionSize = left.size + right.size - shared

    return unionSize === 0 ? 0 : shared / unionSize
  }

  private normalise(tags: string[]): Set<string> {
    return new Set(tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0))
  }
}
