import { describe, expect, it } from 'vitest'
import { MatchingService } from './MatchingService'

const matching = new MatchingService()

const volunteer = {
  skills: ['Teamwork', 'Graphic design'],
  interests: ['Environment', 'Education'],
}

describe('MatchingService.score', () => {
  it('returns 0 when nothing overlaps', () => {
    const score = matching.score(volunteer, {
      requiredSkills: ['Plumbing'],
      categories: ['Sport'],
    })

    expect(score).toBe(0)
  })

  it('returns 100 when both sets match exactly', () => {
    const score = matching.score(volunteer, {
      requiredSkills: ['Teamwork', 'Graphic design'],
      categories: ['Environment', 'Education'],
    })

    expect(score).toBe(100)
  })

  it('ignores case and surrounding spaces', () => {
    const score = matching.score(volunteer, {
      requiredSkills: ['  teamwork ', 'GRAPHIC DESIGN'],
      categories: ['environment', 'education'],
    })

    expect(score).toBe(100)
  })

  it('weights a skills match above an interests match', () => {
    const skillsOnly = matching.score(volunteer, {
      requiredSkills: ['Teamwork', 'Graphic design'],
      categories: [],
    })

    const interestsOnly = matching.score(volunteer, {
      requiredSkills: [],
      categories: ['Environment', 'Education'],
    })

    expect(skillsOnly).toBeGreaterThan(interestsOnly)
    expect(skillsOnly).toBe(65)
    expect(interestsOnly).toBe(35)
  })

  it('gives a partial score for a partial overlap', () => {
    const score = matching.score(volunteer, {
      requiredSkills: ['Teamwork'],
      categories: ['Environment'],
    })

    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })

  it('returns 0 when the opportunity has no tags at all', () => {
    const score = matching.score(volunteer, { requiredSkills: [], categories: [] })

    expect(score).toBe(0)
  })
})

describe('MatchingService.rank', () => {
  it('orders opportunities from best match to worst', () => {
    const ranked = matching.rank(volunteer, [
      { id: 'poor', requiredSkills: ['Plumbing'], categories: ['Sport'] },
      { id: 'best', requiredSkills: ['Teamwork', 'Graphic design'], categories: ['Environment', 'Education'] },
      { id: 'partial', requiredSkills: ['Teamwork'], categories: [] },
    ])

    expect(ranked.map(entry => entry.opportunity.id)).toEqual(['best', 'partial', 'poor'])
  })
})
